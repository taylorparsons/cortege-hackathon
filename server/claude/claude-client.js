/**
 * Claude API client — thin wrapper around @anthropic-ai/sdk.
 * Implements: FR-012, FR-016, FR-017, NFR-001, NFR-013
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
export const TIMEOUT_MS = 30000;
const DEBUG = process.env.CLAUDE_DEBUG === '1' || process.env.CLAUDE_DEBUG === 'true';

/**
 * Calls the Claude API with tool_use enforcement.
 *
 * Supports two calling conventions:
 * 1. Split prompt (preferred): { templateBody, memoryText } — enables prompt caching
 * 2. Legacy: { systemPrompt } — used as-is, no caching
 *
 * @param {object} opts
 * @param {string} [opts.templateBody]  Static agent template (cached via cache_control)
 * @param {string} [opts.memoryText]    Dynamic memory text (not cached)
 * @param {string} [opts.systemPrompt]  Legacy: full system prompt string (no caching)
 * @param {string} opts.userMessage     Serialized event payload
 * @param {Array}  opts.tools           Tool definitions (e.g. [SUBMIT_ASSESSMENT_TOOL])
 * @param {string} [opts.model]         Model override; defaults to DEFAULT_MODEL
 * @returns {Promise<object>}           Raw Anthropic API response
 */
export async function callClaude({ templateBody, memoryText, systemPrompt, userMessage, tools, model }) {
  const resolvedModel = model ?? DEFAULT_MODEL;

  // Build system message: split prompt with caching, or legacy string
  let system;
  if (templateBody) {
    system = [
      { type: 'text', text: templateBody, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: '\n\n## Current Memory\n' + (memoryText || '') },
    ];
  } else {
    system = systemPrompt;
  }

  const apiCall = client.messages.create({
    model: resolvedModel,
    max_tokens: 4096,
    system,
    tools,
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Claude API timeout after 30s')), TIMEOUT_MS)
  );

  try {
    const response = await Promise.race([apiCall, timeout]);

    if (DEBUG) {
      const u = response?.usage ?? {};
      const cacheWrite = u.cache_creation_input_tokens ?? 0;
      const cacheRead = u.cache_read_input_tokens ?? 0;
      const inputTokens = u.input_tokens ?? 0;
      const outputTokens = u.output_tokens ?? 0;
      const cacheStatus = cacheRead > 0 ? 'HIT' : cacheWrite > 0 ? 'WRITE' : 'NONE';
      console.log(
        `[claude] model=${resolvedModel} cache=${cacheStatus} ` +
        `input=${inputTokens} output=${outputTokens} ` +
        `cache_write=${cacheWrite} cache_read=${cacheRead}`
      );
      // Log full usage object on first call to verify cache fields exist
      if (!callClaude._logged) {
        console.log(`[claude] usage keys: ${JSON.stringify(Object.keys(u))}`);
        console.log(`[claude] system type: ${Array.isArray(system) ? 'array (caching enabled)' : 'string (legacy)'}`);
        callClaude._logged = true;
      }
    }

    return response;
  } catch (err) {
    // Surface rate-limit errors with a recognisable message
    if (err?.status === 429) {
      throw new Error('Claude API rate limit');
    }
    throw err;
  }
}

export default callClaude;
