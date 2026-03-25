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
import { WardenEngine } from '../warden/warden-engine.js';

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class Orchestrator {
  constructor(options = {}) {
    this.household = null;
    this.activeHousehold = null;
    this.activeHouseholdId = null;
    this.agentInstances = new Map();
    this.agentFactory = null;
    this.simulator = null;
    this.eventBus = eventBus;
    this.scheduler = null;
    this.escalationHandler = null;
    this.householdStore = null;
    this.locationStore = null;
    this.wardenEngine = null;
    this.enableHouseholdStore = options.enableHouseholdStore ?? false;
    this._ws = null;
    this._agentsDir = path.resolve('agents');
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
    this._ws = ws;

    // 1. Initialize household store if enabled
    if (this.enableHouseholdStore) {
      this.householdStore = new HouseholdStore('data/households');
      this.locationStore = new LocationStore('data/locations');
      console.log('[orchestrator] Household store initialized');
    }

    // 2. Load agent templates
    const templates = loadTemplates(this._agentsDir);
    console.log(`[orchestrator] Loaded ${templates.size} agent template(s)`);

    // Expose a minimal agentFactory-like object (supports reload)
    this.agentFactory = {
      templates,
      reload: async () => {
        const fresh = loadTemplates(this._agentsDir);
        this.agentFactory.templates = fresh;
        console.log('[orchestrator] Agent templates hot-reloaded');
      },
    };

    // 3. Activate initial household
    if (this.householdStore) {
      const initialHouseholdId = await this._resolveInitialHouseholdId();
      await this.activateHousehold(initialHouseholdId);
    } else {
      const householdPath = path.resolve('data/household.json');
      const householdData = loadHousehold(householdPath);
      await this._activateHouseholdData(householdData);
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

    // 10. Start WARDEN engine
    this.wardenEngine = new WardenEngine({
      eventBus,
      escalationHandler: this.escalationHandler,
      ws,
      householdStore: this.householdStore,
      locationStore: this.locationStore,
    });
    this.wardenEngine.start();

    console.log('[orchestrator] Started successfully');
    return this;
  }

  // ---------------------------------------------------------------------------
  // stop
  // ---------------------------------------------------------------------------

  /** Gracefully stop the orchestrator. */
  stop() {
    this._teardownActiveHousehold();
    if (this.scheduler) {
      this.scheduler.stop();
    }
    if (this.wardenEngine) {
      this.wardenEngine.stop();
    }
    console.log('[orchestrator] Stopped');
  }

  async activateHousehold(householdId) {
    if (!this.householdStore) {
      throw new Error('Household store not enabled');
    }
    if (!householdId) {
      throw new Error('householdId is required');
    }
    if (this.activeHouseholdId === householdId && this.agentInstances.size > 0) {
      return this.activeHousehold;
    }

    const household = await this.householdStore.getHousehold(householdId);
    await this._activateHouseholdData(household);
    return this.activeHousehold;
  }

  async _resolveInitialHouseholdId() {
    const configuredId = process.env.DEFAULT_HOUSEHOLD_ID;
    if (configuredId) {
      return configuredId;
    }
    const households = await this.householdStore.listHouseholds();
    if (households.length === 0) {
      throw new Error('No households found in household store');
    }
    // Skip empty households when selecting default
    const nonEmptyHousehold = households.find(h => h.member_count > 0);
    if (nonEmptyHousehold) {
      console.log(`[orchestrator] Selected first non-empty household: ${nonEmptyHousehold.household_id}`);
      return nonEmptyHousehold.household_id;
    }
    // Fall back to first household if all are empty
    console.warn('[orchestrator] All households are empty, using first household');
    return households[0].household_id;
  }

  async _activateHouseholdData(householdData) {
    this._teardownActiveHousehold();

    this.activeHousehold = householdData;
    this.activeHouseholdId = householdData.household_id ?? null;
    this.household = householdData.members ?? [];
    console.log(
      `[orchestrator] Activated household "${householdData.name}" with ${this.household.length} member(s)`
    );

    this.agentInstances = createInstances(this.agentFactory.templates, this.household);
    console.log(`[orchestrator] Created ${this.agentInstances.size} agent instance(s)`);

    for (const instance of this.agentInstances.values()) {
      instance.initMemory();
    }

    this.escalationHandler = new EscalationHandler(this.household, this._ws);
    this._subscribeAgentInstances();
    this._restartScheduler();
  }

  _teardownActiveHousehold() {
    if (this.scheduler) {
      this.scheduler.stop();
      this.scheduler = null;
    }
    for (const [instanceId] of this.agentInstances) {
      eventBus.unsubscribeAll(instanceId);
    }
    this.agentInstances = new Map();
    this.escalationHandler = null;
  }

  _restartScheduler() {
    const customSchedules = [];
    for (const { config } of this.agentFactory.templates.values()) {
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
  }

  _subscribeAgentInstances() {
    for (const [instanceId, instance] of this.agentInstances) {
      const configuredTypes = instance.config?.event_types ?? null;
      const eventTypes = Array.isArray(configuredTypes) && configuredTypes.length > 0
        ? configuredTypes
        : [...EXTERNAL_EVENT_TYPES];

      for (const eventType of eventTypes) {
        try {
          eventBus.subscribe(
            eventType,
            instanceId,
            (event) => {
              instance.processEvent(event, this._ws).then((response) => {
                if (response && this.escalationHandler) {
                  this.escalationHandler.handle(response, instance);
                }
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
  }
}

export default Orchestrator;
