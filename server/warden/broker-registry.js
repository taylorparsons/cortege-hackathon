/**
 * BrokerRegistry — Loads and validates data broker definitions.
 * Implements: FR-002
 *
 * Broker definitions live in server/warden/brokers/*.json.
 * Each file is a declarative spec for how to search and opt-out of one broker.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BROKERS_DIR = path.join(__dirname, 'brokers');

const REQUIRED_FIELDS = ['id', 'name', 'opt_out_url', 'requires_pii', 'steps'];
const VALID_STEP_ACTIONS = new Set([
  'web_search',
  'navigate',
  'fill',
  'click',
  'wait',
  'detect_captcha',
  'detect_success',
  'extract_associates',
  'wait_for_navigation',
  'select',
  'check',
]);

export class BrokerRegistry {
  constructor(brokersDir = DEFAULT_BROKERS_DIR) {
    this.brokersDir = brokersDir;
    this._brokers = new Map();
    this._loaded = false;
  }

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  load() {
    if (!fs.existsSync(this.brokersDir)) {
      throw new Error(`Brokers directory not found: ${this.brokersDir}`);
    }

    const files = fs.readdirSync(this.brokersDir).filter((f) => f.endsWith('.json'));
    this._brokers.clear();

    for (const file of files) {
      const fp = path.join(this.brokersDir, file);
      let def;
      try {
        def = JSON.parse(fs.readFileSync(fp, 'utf8'));
      } catch (err) {
        console.error(`[broker-registry] Failed to parse ${file}: ${err.message}`);
        continue;
      }

      const errors = this._validate(def, file);
      if (errors.length > 0) {
        console.error(`[broker-registry] Invalid broker def ${file}: ${errors.join(', ')}`);
        continue;
      }

      this._brokers.set(def.id, def);
    }

    this._loaded = true;
    console.log(`[broker-registry] Loaded ${this._brokers.size} broker definitions`);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  _validate(def, filename) {
    const errors = [];

    for (const field of REQUIRED_FIELDS) {
      if (!def[field]) errors.push(`missing required field: ${field}`);
    }

    if (def.id && def.id !== path.basename(filename, '.json')) {
      errors.push(`id "${def.id}" does not match filename "${filename}"`);
    }

    if (Array.isArray(def.steps)) {
      for (const [i, step] of def.steps.entries()) {
        if (!step.action) {
          errors.push(`step[${i}] missing action`);
        } else if (!VALID_STEP_ACTIONS.has(step.action)) {
          errors.push(`step[${i}] unknown action: ${step.action}`);
        }
      }
    }

    // Validate requires_headed_mode if present
    if ('requires_headed_mode' in def) {
      if (typeof def.requires_headed_mode !== 'boolean') {
        errors.push('requires_headed_mode must be boolean');
      }
    }

    return errors;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  getBroker(id) {
    if (!this._loaded) this.load();
    return this._brokers.get(id) ?? null;
  }

  listBrokers() {
    if (!this._loaded) this.load();
    return [...this._brokers.values()];
  }

  /**
   * Returns brokers applicable to a member given the PII they have available.
   *
   * @param {object} availablePii  e.g. { name: true, phone: true, address: false }
   * @returns {Array} broker definitions
   */
  getBrokersForMember(availablePii) {
    if (!this._loaded) this.load();
    return [...this._brokers.values()].filter((broker) => {
      if (!Array.isArray(broker.requires_pii)) return false;
      return broker.requires_pii.every((field) => availablePii[field]);
    });
  }

  get size() {
    if (!this._loaded) this.load();
    return this._brokers.size;
  }
}

export default BrokerRegistry;
