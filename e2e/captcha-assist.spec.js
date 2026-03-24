/**
 * E2E tests for CaptchaAssist modal.
 * Covers: FR-004, FR-007 (20260323-warden-agent)
 *
 * CaptchaAssist appears when the app receives a warden:captcha_required
 * WebSocket event. Tests inject a fake WS message by patching window.WebSocket
 * via addInitScript and invoking the app's onmessage handler directly.
 */

import { test, expect } from '@playwright/test';

const FRONT = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Patches window.WebSocket before page scripts run so the app's WS instance
 * is captured in window.__mockWs.
 */
async function interceptWebSocket(page) {
  await page.addInitScript(() => {
    window.__mockWs = null;
    const OrigWS = window.WebSocket;
    window.WebSocket = class extends OrigWS {
      constructor(...args) {
        super(...args);
        window.__mockWs = this;
      }
    };
    // Preserve static constants
    Object.setPrototypeOf(window.WebSocket, OrigWS);
    window.WebSocket.CONNECTING = OrigWS.CONNECTING ?? 0;
    window.WebSocket.OPEN       = OrigWS.OPEN       ?? 1;
    window.WebSocket.CLOSING    = OrigWS.CLOSING    ?? 2;
    window.WebSocket.CLOSED     = OrigWS.CLOSED     ?? 3;
  });
}

/**
 * Waits for the app's WebSocket to open, then directly invokes its onmessage
 * handler with a synthetic MessageEvent — more reliable than dispatchEvent
 * for triggering React state updates from synthetic messages.
 */
async function injectWsMessage(page, payload) {
  await page.waitForFunction(
    () => window.__mockWs?.readyState === 1,
    { timeout: 10000 }
  );
  await page.evaluate((data) => {
    const ws = window.__mockWs;
    if (!ws) throw new Error('No WS instance captured');
    const handler = ws.onmessage;
    if (!handler) throw new Error('onmessage not set on WS');
    handler(new MessageEvent('message', { data: JSON.stringify(data) }));
  }, payload);
}

/** Standard fake captcha session payload. */
function fakeCaptchaSession(overrides = {}) {
  return {
    event: 'warden:captcha_required',
    data: {
      sessionId: 'e2e-captcha-session-001',
      brokerId: 'whitepages',
      brokerName: 'WhitePages',
      memberId: 'e2e-member-001',
      memberName: 'E2E Test Person',
      screenshotBase64: null,
      optOutUrl: 'https://www.whitepages.com/suppression-requests',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('CaptchaAssist modal', () => {

  test('modal is NOT visible on initial page load', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');
    // Give React a moment to settle; no WS message injected
    await page.waitForTimeout(500);
    await expect(page.getByTestId('captcha-assist-modal')).not.toBeVisible();
  });

  test('modal appears when warden:captcha_required WS message is received', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession());

    await expect(page.getByTestId('captcha-assist-modal')).toBeVisible();
  });

  test('modal shows broker name', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession({ brokerName: 'WhitePages' }));

    await expect(page.getByTestId('captcha-assist-broker-name')).toContainText('WhitePages');
  });

  test('modal shows "Open broker" link with correct URL', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession({
      optOutUrl: 'https://www.whitepages.com/suppression-requests',
    }));

    const link = page.getByTestId('captcha-assist-open-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.whitepages.com/suppression-requests');
  });

  test('screenshot is NOT rendered when screenshotBase64 is null', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession({ screenshotBase64: null }));

    await expect(page.getByTestId('captcha-assist-modal')).toBeVisible();
    await expect(page.getByTestId('captcha-assist-screenshot')).not.toBeVisible();
  });

  test('Dismiss button closes the modal', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession());
    await expect(page.getByTestId('captcha-assist-modal')).toBeVisible();

    await page.getByTestId('btn-captcha-dismiss').click();
    await expect(page.getByTestId('captcha-assist-modal')).not.toBeVisible();
  });

  test('"Mark as Resolved" calls POST /api/warden/captcha/:sessionId/resolve', async ({ page }) => {
    await interceptWebSocket(page);

    // Intercept the resolve HTTP call — route at Vite (5173) since apiUrl returns a relative path
    let resolvedSessionId = null;
    await page.route(`${FRONT}/api/warden/captcha/*/resolve`, (route) => {
      resolvedSessionId = route.request().url().split('/captcha/')[1].replace('/resolve', '');
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession({ sessionId: 'e2e-captcha-session-001' }));
    await expect(page.getByTestId('captcha-assist-modal')).toBeVisible();

    await page.getByTestId('btn-captcha-resolve').click();

    // Give the fetch call a moment to be intercepted
    await page.waitForTimeout(500);
    expect(resolvedSessionId).toBe('e2e-captcha-session-001');
  });

  test('second warden:captcha_required replaces the first when first is resolved', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    // Inject first CAPTCHA
    await injectWsMessage(page, fakeCaptchaSession({ sessionId: 'session-A', brokerName: 'WhitePages' }));
    await expect(page.getByTestId('captcha-assist-broker-name')).toContainText('WhitePages');

    // Resolve the first — warden:captcha_resolved removes it, second appears
    await injectWsMessage(page, {
      event: 'warden:captcha_resolved',
      data: { sessionId: 'session-A' },
    });
    await injectWsMessage(page, fakeCaptchaSession({ sessionId: 'session-B', brokerName: 'Spokeo' }));

    await expect(page.getByTestId('captcha-assist-broker-name')).toContainText('Spokeo');
  });

  test('warden:captcha_expired removes the modal', async ({ page }) => {
    await interceptWebSocket(page);
    await page.goto('/');

    await injectWsMessage(page, fakeCaptchaSession({ sessionId: 'expiring-session' }));
    await expect(page.getByTestId('captcha-assist-modal')).toBeVisible();

    await injectWsMessage(page, {
      event: 'warden:captcha_expired',
      data: { sessionId: 'expiring-session' },
    });

    await expect(page.getByTestId('captcha-assist-modal')).not.toBeVisible();
  });
});
