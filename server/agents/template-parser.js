/**
 * Template Parser — Parses agent.md files using gray-matter.
 * Implements: FR-002, FR-003, FR-005, NFR-006
 */

import fs from 'node:fs';
import matter from 'gray-matter';
import { ALL_EVENT_TYPES } from '../orchestrator/event-bus.js';

// ---------------------------------------------------------------------------
// Required frontmatter fields
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['name', 'events', 'threat_model', 'escalation', 'learning'];

// ---------------------------------------------------------------------------
// validateTemplate
// ---------------------------------------------------------------------------

/**
 * Validates parsed frontmatter config and system prompt.
 * @param {object} config  Frontmatter data
 * @param {string} systemPrompt  Markdown body
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTemplate(config, systemPrompt) {
  const errors = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (config[field] === undefined || config[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // events must be a non-empty array of valid event types
  if (config.events !== undefined) {
    if (!Array.isArray(config.events) || config.events.length === 0) {
      errors.push('Field "events" must be a non-empty array');
    } else {
      for (const eventType of config.events) {
        if (!ALL_EVENT_TYPES.has(eventType)) {
          errors.push(`Unknown event type in "events": "${eventType}"`);
        }
      }
    }
  }

  // systemPrompt must be a non-empty string
  if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
    errors.push('Agent template must have a non-empty markdown body (system prompt)');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// parseTemplate
// ---------------------------------------------------------------------------

/**
 * Parses an agent.md file.
 * @param {string} filepath  Absolute or relative path to agent.md
 * @returns {{ config: object, systemPrompt: string, errors: string[] }}
 */
export function parseTemplate(filepath) {
  let raw;
  try {
    raw = fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    return {
      config: {},
      systemPrompt: '',
      errors: [`Could not read file "${filepath}": ${err.message}`],
    };
  }

  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    return {
      config: {},
      systemPrompt: '',
      errors: [`Failed to parse YAML frontmatter in "${filepath}": ${err.message}`],
    };
  }

  const config = parsed.data ?? {};
  const systemPrompt = parsed.content ?? '';

  const { errors } = validateTemplate(config, systemPrompt);

  return { config, systemPrompt, errors };
}
