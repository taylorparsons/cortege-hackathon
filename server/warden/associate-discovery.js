/**
 * AssociateDiscovery — Extracts "associated people" from broker search result pages.
 * Implements: FR-008 (20260323-warden-agent)
 *
 * Uses broker-specific associate_selectors to scrape names and relationships
 * from broker listing pages. Deduplication happens in BrokerScanStore.
 */

import { sanitizeString } from '../privacy/pii.js';

export class AssociateDiscovery {
  /**
   * Extract associated people from the current page using broker-defined selectors.
   *
   * @param {object} page           Playwright Page object
   * @param {object} associateSelectors  From broker definition: { container, name, relationship }
   * @returns {Array<{ name: string, relationship: string }>}
   */
  static async extractFromPage(page, associateSelectors) {
    if (!associateSelectors?.name) return [];

    try {
      const { container, name: nameSelector, relationship: relSelector } = associateSelectors;

      // If no container, use the name selector directly across the whole page
      if (!container) {
        return await AssociateDiscovery._extractByNameSelector(page, nameSelector, relSelector);
      }

      // Try container-scoped extraction
      const containers = await page.$$(container).catch(() => []);
      if (containers.length === 0) {
        // Fall back to page-wide name selector
        return await AssociateDiscovery._extractByNameSelector(page, nameSelector, relSelector);
      }

      const results = [];
      for (const el of containers) {
        try {
          const name = await el.$eval(nameSelector, (n) => n.textContent?.trim()).catch(() => null);
          const relationship = relSelector
            ? await el.$eval(relSelector, (r) => r.textContent?.trim()).catch(() => null)
            : null;

          if (name && name.length > 1) {
            results.push({
              name: AssociateDiscovery._normalizeName(name),
              relationship: relationship ? sanitizeString(relationship) : 'associated',
            });
          }
        } catch {
          // skip malformed container
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  static async _extractByNameSelector(page, nameSelector, relSelector) {
    const names = await page.$$eval(
      nameSelector,
      (els) => els.map((el) => el.textContent?.trim()).filter(Boolean)
    ).catch(() => []);

    const rels = relSelector
      ? await page.$$eval(relSelector, (els) => els.map((el) => el.textContent?.trim())).catch(() => [])
      : [];

    return names.map((name, i) => ({
      name: AssociateDiscovery._normalizeName(name),
      relationship: rels[i] ? sanitizeString(rels[i]) : 'associated',
    })).filter((a) => a.name.length > 1);
  }

  static _normalizeName(raw) {
    return raw
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s'-]/g, '')
      .trim()
      .slice(0, 100); // cap length
  }

  /**
   * Filter discovered associates against existing household member names.
   *
   * @param {Array<{ name, relationship }>} discovered
   * @param {string[]} existingMemberNames  Decrypted names of current household members
   * @returns {Array<{ name, relationship }>}  Associates not already in the household
   */
  static filterExistingMembers(discovered, existingMemberNames) {
    const existingLower = new Set(existingMemberNames.map((n) => n.toLowerCase().trim()));
    return discovered.filter((a) => !existingLower.has(a.name.toLowerCase().trim()));
  }
}

export default AssociateDiscovery;
