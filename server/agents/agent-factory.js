/**
 * Agent Factory — Scans agents/ directory, parses templates, creates instances.
 * Implements: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-006, EC6
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseTemplate } from './template-parser.js';
import AgentInstance from './agent-instance.js';

// ---------------------------------------------------------------------------
// loadTemplates
// ---------------------------------------------------------------------------

/**
 * Scans agentsDir for subdirectories containing agent.md, parses each.
 * Skips _template/ directory and any templates that fail validation.
 *
 * @param {string} agentsDir  Absolute path to the agents/ directory
 * @returns {Map<string, { config: object, systemPrompt: string }>}
 */
export function loadTemplates(agentsDir) {
  const templates = new Map();

  let entries;
  try {
    entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  } catch (err) {
    console.error(`[agent-factory] Cannot read agents directory "${agentsDir}": ${err.message}`);
    return templates;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '_template') continue;

    const agentMdPath = path.join(agentsDir, entry.name, 'agent.md');

    if (!fs.existsSync(agentMdPath)) {
      console.warn(`[agent-factory] No agent.md found in "${entry.name}", skipping`);
      continue;
    }

    const { config, systemPrompt, errors } = parseTemplate(agentMdPath);

    if (errors.length > 0) {
      console.error(
        `[agent-factory] Invalid template "${agentMdPath}" — skipping:\n` +
        errors.map((e) => `  • ${e}`).join('\n')
      );
      continue;
    }

    const agentName = (config.name ?? entry.name).toLowerCase();
    templates.set(agentName, { config, systemPrompt });
    console.log(`[agent-factory] Registered agent type: "${agentName}"`);
  }

  return templates;
}

// ---------------------------------------------------------------------------
// createInstances
// ---------------------------------------------------------------------------

/**
 * Creates one AgentInstance per household member by matching templates.
 * Matching priority: member.companion (explicit override) > profile_type match.
 *
 * @param {Map<string, { config: object, systemPrompt: string }>} templates
 * @param {Array<{ id: string, name: string, profile_type: string, companion?: string }>} members
 * @returns {Map<string, AgentInstance>}  keyed by instanceId
 */
export function createInstances(templates, members) {
  const instances = new Map();

  for (const member of members) {
    let matchedName = null;
    let matchedTemplate = null;

    // 1. Explicit companion override
    if (member.companion) {
      const key = member.companion.toLowerCase();
      if (templates.has(key)) {
        matchedName = key;
        matchedTemplate = templates.get(key);
      } else {
        console.warn(
          `[agent-factory] Member "${member.name}" has companion override "${member.companion}" ` +
          `but no such template is registered — falling back to profile_type match`
        );
      }
    }

    // 2. profile_type match
    if (!matchedTemplate && member.profile_type) {
      for (const [name, tpl] of templates) {
        if (tpl.config.profile_type === member.profile_type) {
          matchedName = name;
          matchedTemplate = tpl;
          break;
        }
      }
    }

    if (!matchedTemplate) {
      console.warn(
        `[agent-factory] No matching agent template for member "${member.name}" ` +
        `(profile_type: "${member.profile_type}", companion: "${member.companion ?? 'none'}") — skipping`
      );
      continue;
    }

    const instanceId = `${matchedName}-${member.id}`;
    const instance = new AgentInstance({
      id: instanceId,
      agentName: matchedName,
      memberId: member.id,
      memberName: member.name,
      config: matchedTemplate.config,
      systemPrompt: matchedTemplate.systemPrompt,
    });

    instances.set(instanceId, instance);
    console.log(`[agent-factory] Created instance "${instanceId}" for member "${member.name}"`);
  }

  return instances;
}

// ---------------------------------------------------------------------------
// reload
// ---------------------------------------------------------------------------

/**
 * Hot-reloads agent templates and re-creates instances.
 * Unsubscribes old instances from eventBus, subscribes new ones.
 *
 * @param {string} agentsDir
 * @param {Array} members
 * @param {import('../orchestrator/event-bus.js').EventBus} eventBus
 * @param {Map<string, AgentInstance>} [currentInstances]  Existing instances to unsubscribe
 * @returns {Map<string, AgentInstance>}
 */
export function reload(agentsDir, members, eventBus, currentInstances = new Map()) {
  // Unsubscribe all existing instances
  for (const [instanceId] of currentInstances) {
    eventBus.unsubscribeAll(instanceId);
    console.log(`[agent-factory] Unsubscribed instance "${instanceId}"`);
  }

  const templates = loadTemplates(agentsDir);
  const instances = createInstances(templates, members);

  // Subscribe new instances to their configured event types
  for (const [instanceId, instance] of instances) {
    const events = instance.config.events ?? [];
    for (const eventType of events) {
      eventBus.subscribe(
        eventType,
        instanceId,
        (event) => {
          // Placeholder handler — orchestrator will replace this with real processing
          console.log(`[agent-factory] Instance "${instanceId}" received event "${eventType}" (id: ${event.id})`);
        },
        instance.memberId
      );
    }
    console.log(
      `[agent-factory] Subscribed "${instanceId}" to events: [${events.join(', ')}]`
    );
  }

  return instances;
}
