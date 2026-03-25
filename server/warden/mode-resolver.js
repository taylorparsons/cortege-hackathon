/**
 * ModeResolver — Determines browser mode for WARDEN scans.
 * Priority: user override > broker config > env var > default (headless)
 */

export class ModeResolver {
  /**
   * Resolve browser mode for a scan job.
   * @param {object} job - Scan job with optional headedOverride
   * @param {object} brokerDef - Broker definition with optional requires_headed_mode
   * @param {boolean} globalHeadedMode - WARDEN_HEADED_MODE env var
   * @returns {'headed' | 'headless'}
   */
  static resolve(job, brokerDef, globalHeadedMode = false) {
    // Priority 1: User override
    if (job.headedOverride === true) return 'headed';
    if (job.headedOverride === false) return 'headless';
    
    // Priority 2: Broker configuration
    if (brokerDef.requires_headed_mode === true) return 'headed';
    if (brokerDef.requires_headed_mode === false) return 'headless';
    
    // Priority 3: Global env var (deprecated)
    if (globalHeadedMode) {
      console.warn(
        '[mode-resolver] Using deprecated WARDEN_HEADED_MODE env var. ' +
        'Use per-broker requires_headed_mode instead.'
      );
      return 'headed';
    }
    
    // Default: headless
    return 'headless';
  }
}
