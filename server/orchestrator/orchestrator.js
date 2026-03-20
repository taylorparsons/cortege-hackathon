/**
 * Orchestrator — Wires all CORTEGE subsystems together.
 * Implements: FR-001, FR-008, FR-025, FR-026, FR-041
 */

import path from 'node:path';
import eventBus from './event-bus.js';
import { loadHousehold } from '../agents/household.js';
import { loadTemplates, createInstances } from '../agents/agent-factory.js';
import { EscalationHandler } from '../escalation/escalation-handler.js';
import { EventSimulator } from '../ingestion/simulator.js';
import { Scheduler } from './scheduler.js';
import { EXTERNAL_EVENT_TYPES } from './event-bus.js';
import { HouseholdStore } from '../storage/household-store.js';
import { LocationStore } from '../storage/location-store.js';
import { ensurePiiReady } from '../privacy/pii.js';

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class Orchestrator {
  constructor(options = {}) {
    this.household = null;
    this.agentInstances = new Map();
    this.agentFactory = null;
    this.simulator = null;
    this.eventBus = eventBus;
    this.scheduler = null;
    this.householdStore = null;
    this.locationStore = null;
    this.enableHouseholdStore = options.enableHouseholdStore ?? false;
  }

  // ---------------------------------------------------------------------------
  // start
  // ---------------------------------------------------------------------------

  /**
   * Boots the orchestration system.
   *
   * @param {Function} ws  ws(eventName, data) — WebSocket emitter
   * @returns {Promise<Orchestrator>}  this, for chaining
   */
  async start(ws) {
    ensurePiiReady();

    // 1. Load household
    const householdPath = path.resolve('data/household.json');
    const householdData = loadHousehold(householdPath);
    this.household = householdData.members;
    console.log(`[orchestrator] Loaded household "${householdData.name}" with ${this.household.length} member(s)`);

    // 1.5. Initialize household store if enabled
    if (this.enableHouseholdStore) {
      this.householdStore = new HouseholdStore('data/households');
      this.locationStore = new LocationStore('data/locations');
      console.log('[orchestrator] Household store initialized');
    }

    // 2. Load agent templates
    const agentsDir = path.resolve('agents');
    const templates = loadTemplates(agentsDir);
    console.log(`[orchestrator] Loaded ${templates.size} agent template(s)`);

    // Expose a minimal agentFactory-like object (supports reload)
    this.agentFactory = {
      templates,
      reload: async () => {
        const fresh = loadTemplates(agentsDir);
        this.agentFactory.templates = fresh;
        console.log('[orchestrator] Agent templates hot-reloaded');
      },
    };

    // 3. Create agent instances (one per household member)
    this.agentInstances = createInstances(templates, this.household);
    console.log(`[orchestrator] Created ${this.agentInstances.size} agent instance(s)`);

    // 4. Initialize memory for each instance
    for (const instance of this.agentInstances.values()) {
      instance.initMemory();
    }

    // 5. Create escalation handler
    const escalationHandler = new EscalationHandler(this.household, ws);

    // 6. Subscribe each agent instance to its relevant event types
    for (const [instanceId, instance] of this.agentInstances) {
      const configuredTypes = instance.config?.event_types ?? null;

      let eventTypes;
      if (Array.isArray(configuredTypes) && configuredTypes.length > 0) {
        eventTypes = configuredTypes;
      } else {
        // Default: subscribe to all external event types
        eventTypes = [...EXTERNAL_EVENT_TYPES];
      }

      for (const eventType of eventTypes) {
        try {
          eventBus.subscribe(
            eventType,
            instanceId,
            (event) => {
              instance.processEvent(event, ws).then((response) => {
                if (response) escalationHandler.handle(response, instance);
              }).catch((err) => {
                console.error(`[orchestrator] processEvent error for "${instanceId}": ${err.message}`);
              });
            },
            instance.memberId
          );
        } catch (err) {
          console.warn(`[orchestrator] Could not subscribe "${instanceId}" to "${eventType}": ${err.message}`);
        }
      }

      console.log(`[orchestrator] Subscribed "${instanceId}" to: [${eventTypes.join(', ')}]`);
    }

    // 7. Wire event bus: on any event → emit event:received via ws
    eventBus.on('*', (event) => {
      ws('event:received', {
        id: event.id,
        type: event.type,
        source: event.source,
        timestamp: event.timestamp,
        target_member: event.target_member,
        payload: event.payload,
      });
    });

    // 8. Create EventSimulator
    this.simulator = new EventSimulator(eventBus, path.resolve('scenarios'));

    // 9. Create and start Scheduler
    // Collect custom schedules from all agent template frontmatters
    const customSchedules = [];
    for (const { config } of templates.values()) {
      if (Array.isArray(config.schedules)) {
        for (const schedule of config.schedules) {
          if (schedule.type && schedule.cron) {
            customSchedules.push(schedule);
          }
        }
      }
    }

    this.scheduler = new Scheduler(this.agentInstances, eventBus, { customSchedules });
    this.scheduler.start();

    console.log('[orchestrator] Started successfully');
    return this;
  }

  // ---------------------------------------------------------------------------
  // stop
  // ---------------------------------------------------------------------------

  /** Gracefully stop the orchestrator. */
  stop() {
    if (this.scheduler) {
      this.scheduler.stop();
    }
    console.log('[orchestrator] Stopped');
  }
}

export default Orchestrator;
