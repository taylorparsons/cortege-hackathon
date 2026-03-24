/**
 * BrowserSession — Playwright chromium wrapper for WARDEN broker automation.
 * Implements: FR-003, FR-004 (20260323-warden-agent)
 *
 * State machine: idle → navigating → interacting → waiting_captcha → completed | error
 * CAPTCHA detection pauses the session; resume() continues from the paused point.
 */

const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  '.g-recaptcha',
  '#g-recaptcha',
  'iframe[src*="hcaptcha"]',
  '.h-captcha',
  '#challenge-running',
  '#challenge-stage',
  '.cf-challenge-running',
  '.cf-im-under-attack',
  'iframe[title*="reCAPTCHA"]',
  'iframe[title*="hCaptcha"]',
];

export class BrowserSession {
  constructor() {
    this.browser = null;
    this.page = null;
    this.state = 'idle';
    this._resolveResume = null;
    this._screenshot = null;
    this._screenshotAt = null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async launch({ headless = true } = {}) {
    // Dynamic import so playwright-core is optional during unit tests
    const { chromium } = await import('playwright-core');
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    this.page = await context.newPage();
    this.state = 'idle';
    return this;
  }

  async close() {
    if (this._resolveResume) {
      this._resolveResume(false);
      this._resolveResume = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.page = null;
    }
    this.state = 'idle';
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async navigate(url, { waitUntil = 'domcontentloaded', timeout = 15000 } = {}) {
    this.state = 'navigating';
    await this.page.goto(url, { waitUntil, timeout });
    this.state = 'interacting';
  }

  // ---------------------------------------------------------------------------
  // Form interaction
  // ---------------------------------------------------------------------------

  async fill(selector, value, { timeout = 5000 } = {}) {
    const el = await this.page.waitForSelector(selector, { timeout }).catch(() => null);
    if (!el) throw new Error(`fill: selector not found: ${selector}`);
    await el.fill(String(value ?? ''));
  }

  async click(selector, { timeout = 5000 } = {}) {
    const el = await this.page.waitForSelector(selector, { timeout }).catch(() => null);
    if (!el) throw new Error(`click: selector not found: ${selector}`);
    await el.click();
  }

  async select(selector, value, { timeout = 5000 } = {}) {
    const el = await this.page.waitForSelector(selector, { timeout }).catch(() => null);
    if (!el) throw new Error(`select: selector not found: ${selector}`);
    await el.selectOption(value);
  }

  async check(selector, { timeout = 5000 } = {}) {
    const el = await this.page.waitForSelector(selector, { timeout }).catch(() => null);
    if (!el) throw new Error(`check: selector not found: ${selector}`);
    await el.check();
  }

  // ---------------------------------------------------------------------------
  // Wait
  // ---------------------------------------------------------------------------

  async waitForSelector(selector, { timeout = 8000 } = {}) {
    const el = await this.page.waitForSelector(selector, { timeout }).catch(() => null);
    return el !== null;
  }

  async waitForNavigation({ timeout = 10000 } = {}) {
    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout }).catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // CAPTCHA detection
  // ---------------------------------------------------------------------------

  /**
   * Checks for CAPTCHA presence using default + broker-specific selectors.
   * @param {string[]} extraSelectors  Broker-specific selectors to also check
   * @returns {boolean}
   */
  async detectCaptcha(extraSelectors = []) {
    const allSelectors = [...CAPTCHA_SELECTORS, ...extraSelectors];
    for (const sel of allSelectors) {
      try {
        const el = await this.page.$(sel);
        if (el) {
          const visible = await el.isVisible().catch(() => false);
          if (visible) return true;
        }
      } catch {
        // selector syntax error — skip
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // CAPTCHA pause / resume
  // ---------------------------------------------------------------------------

  /**
   * Takes a screenshot and transitions to waiting_captcha state.
   * Returns the base64 screenshot string.
   */
  async pauseForCaptcha() {
    this.state = 'waiting_captcha';
    await this._captureScreenshot();
    return this._screenshot;
  }

  /**
   * Returns a Promise that resolves when resume() is called.
   * @returns {Promise<boolean>}  true = resumed by user, false = timed out / closed
   */
  waitForResume() {
    return new Promise((resolve) => {
      this._resolveResume = resolve;
    });
  }

  /**
   * Called externally (from CaptchaManager) when the user resolves the CAPTCHA.
   */
  resume() {
    if (this._resolveResume) {
      this._resolveResume(true);
      this._resolveResume = null;
    }
    this.state = 'interacting';
  }

  // ---------------------------------------------------------------------------
  // Screenshots
  // ---------------------------------------------------------------------------

  async _captureScreenshot() {
    try {
      const buf = await this.page.screenshot({ type: 'png', fullPage: false });
      this._screenshot = buf.toString('base64');
      this._screenshotAt = new Date().toISOString();
    } catch {
      this._screenshot = null;
      this._screenshotAt = null;
    }
  }

  async screenshot() {
    await this._captureScreenshot();
    return { data: this._screenshot, capturedAt: this._screenshotAt };
  }

  // ---------------------------------------------------------------------------
  // DOM extraction
  // ---------------------------------------------------------------------------

  /**
   * Extract text content matching a selector. Returns array of strings.
   */
  async extractText(selector) {
    try {
      return await this.page.$$eval(selector, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean));
    } catch {
      return [];
    }
  }

  /**
   * Extract { text, href } pairs from anchor elements matching a selector.
   */
  async extractLinks(selector) {
    try {
      return await this.page.$$eval(selector, (els) =>
        els.map((el) => ({ text: el.textContent?.trim(), href: el.href })).filter((l) => l.text)
      );
    } catch {
      return [];
    }
  }

  /**
   * Check if any success indicator is present on the page.
   * @param {string[]} indicators  Each can be "text:..." or "selector:..."
   * @returns {boolean}
   */
  async detectSuccess(indicators) {
    for (const indicator of indicators) {
      if (indicator.startsWith('text:')) {
        const text = indicator.slice(5).toLowerCase();
        const content = await this.page.textContent('body').catch(() => '');
        if (content.toLowerCase().includes(text)) return true;
      } else if (indicator.startsWith('selector:')) {
        const sel = indicator.slice(9);
        const el = await this.page.$(sel).catch(() => null);
        if (el) return true;
      }
    }
    return false;
  }

  /**
   * Get the current page URL.
   */
  get url() {
    return this.page?.url() ?? null;
  }
}

export default BrowserSession;
