/**
 * ScanExecutor — Walks a broker's declarative steps[] array against a BrowserSession.
 * Implements: FR-003, FR-008 (20260323-warden-agent)
 *
 * Returns a result object:
 *   { status: 'listed' | 'not_found' | 'removal_pending' | 'captcha_detected' | 'error', associates: [], error?: string }
 */

import { sanitizeString } from '../privacy/pii.js';
import { AssociateDiscovery } from './associate-discovery.js';

export class ScanExecutor {
  /**
   * Execute all steps for one broker against a live BrowserSession.
   *
   * @param {object} session     BrowserSession instance
   * @param {object} brokerDef   Broker definition from BrokerRegistry
   * @param {object} memberPii   Decrypted member PII: { name, first_name, last_name, phone, city, state, city_state, address }
   * @returns {Promise<{ status, associates, error? }>}
   */
  static async execute(session, brokerDef, memberPii) {
    const associates = [];
    let listingFound = false;
    let successDetected = false;

    for (const step of brokerDef.steps) {
      try {
        const result = await ScanExecutor._runStep(step, session, brokerDef, memberPii, associates);

        if (result === 'captcha_detected') {
          return { status: 'captcha_detected', associates };
        }
        if (result === 'exposure_not_confirmed') {
          // web_search found no results — skip this broker
          return { status: 'not_found', associates };
        }
        if (result === 'listing_found') listingFound = true;
        if (result === 'success') successDetected = true;
      } catch (err) {
        const safeMsg = sanitizeString(err.message ?? 'unknown error');
        console.error(`[scan-executor] Step "${step.action}" failed for broker=${brokerDef.id}: ${safeMsg}`);
        return { status: 'error', associates, error: safeMsg };
      }
    }

    if (successDetected) return { status: 'removal_pending', associates };
    if (listingFound) return { status: 'listed', associates };
    return { status: 'not_found', associates };
  }

  // ---------------------------------------------------------------------------
  // Step dispatcher
  // ---------------------------------------------------------------------------

  static async _runStep(step, session, brokerDef, pii, associates) {
    switch (step.action) {
      case 'web_search': {
        // Phase 1: threat assessment — confirm member appears on this broker via web search
        // before spending browser resources on the broker's own site.
        // Uses DuckDuckGo HTML (no JS required, scraper-friendly).
        const query = ScanExecutor._interpolateRaw(step.query, pii);
        const engine = step.engine ?? 'duckduckgo';
        let searchUrl;
        if (engine === 'bing') {
          searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        } else {
          // Default: DuckDuckGo HTML endpoint — returns static results without JS
          searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        }
        await session.navigate(searchUrl, { timeout: step.timeout_ms ?? 15000 });
        // Check for result elements; DDG HTML uses .result__body / .result__title
        const resultSel = step.result_selector ?? '.result__body, .result__title, .results_links';
        const hasResults = await session.waitForSelector(resultSel, { timeout: 6000 });
        if (!hasResults && step.skip_if_no_results !== false) {
          // No results found — member not listed on this broker
          return 'exposure_not_confirmed';
        }
        return 'listing_found';
      }

      case 'navigate': {
        const url = ScanExecutor._interpolate(step.url, pii);
        await session.navigate(url, { timeout: step.timeout_ms ?? 15000 });
        return null;
      }

      case 'fill': {
        const value = step.value_source
          ? ScanExecutor._resolvePii(step.value_source, pii)
          : (step.value ?? '');
        if (!value) return null; // skip if PII not available
        // Try multiple comma-separated selectors
        for (const sel of step.selector.split(',').map((s) => s.trim())) {
          try {
            await session.fill(sel, value, { timeout: step.timeout_ms ?? 5000 });
            return null;
          } catch {
            // try next selector
          }
        }
        console.warn(`[scan-executor] fill: no selector matched for ${step.selector}`);
        return null;
      }

      case 'click': {
        for (const sel of step.selector.split(',').map((s) => s.trim())) {
          try {
            await session.click(sel, { timeout: step.timeout_ms ?? 5000 });
            return null;
          } catch {
            // try next
          }
        }
        console.warn(`[scan-executor] click: no selector matched for ${step.selector}`);
        return null;
      }

      case 'select': {
        const value = step.value_source
          ? ScanExecutor._resolvePii(step.value_source, pii)
          : (step.value ?? '');
        for (const sel of step.selector.split(',').map((s) => s.trim())) {
          try {
            await session.select(sel, value, { timeout: step.timeout_ms ?? 5000 });
            return null;
          } catch {
            // try next
          }
        }
        return null;
      }

      case 'check': {
        for (const sel of step.selector.split(',').map((s) => s.trim())) {
          try {
            await session.check(sel, { timeout: step.timeout_ms ?? 5000 });
            return null;
          } catch {
            // try next
          }
        }
        return null;
      }

      case 'wait': {
        const found = await session.waitForSelector(step.selector, { timeout: step.timeout_ms ?? 8000 });
        if (found) return 'listing_found';
        return null;
      }

      case 'wait_for_navigation': {
        await session.waitForNavigation({ timeout: step.timeout_ms ?? 10000 });
        return null;
      }

      case 'detect_captcha': {
        const extraSelectors = step.selectors ?? [];
        const detected = await session.detectCaptcha(extraSelectors);
        if (detected) {
          await session.pauseForCaptcha();
          return 'captcha_detected';
        }
        return null;
      }

      case 'extract_associates': {
        if (brokerDef.associate_selectors && session.page) {
          const found = await AssociateDiscovery.extractFromPage(
            session.page,
            brokerDef.associate_selectors
          );
          associates.push(...found);
        }
        return null;
      }

      case 'detect_success': {
        const success = await session.detectSuccess(step.indicators ?? []);
        if (success) return 'success';
        return null;
      }

      default:
        console.warn(`[scan-executor] Unknown step action: ${step.action}`);
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // PII resolution
  // ---------------------------------------------------------------------------

  static _resolvePii(source, pii) {
    if (!source.startsWith('member.')) return '';
    const field = source.slice('member.'.length);
    return pii[field] ?? '';
  }

  /**
   * Interpolate {name}, {state}, {city} etc. in URL templates (percent-encodes values).
   */
  static _interpolate(template, pii) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = pii[key] ?? '';
      return encodeURIComponent(val);
    });
  }

  /**
   * Interpolate {name}, {state} etc. in plain-text templates (no percent-encoding).
   * Used for web search query strings where the whole query is encoded later.
   */
  static _interpolateRaw(template, pii) {
    return template.replace(/\{(\w+)\}/g, (_, key) => pii[key] ?? '');
  }
}

export default ScanExecutor;
