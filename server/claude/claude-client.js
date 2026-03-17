/**
 * Claude API client — thin wrapper around @anthropic-ai/sdk.
 * Implements: FR-012, FR-016, FR-017, NFR-001, NFR-013
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
export const TIMEOUT_MS = 30000;

/**
 * Calls the Claude API with tool_use enforcement.
 *
 * @param {object} opts
 * @param {string} opts.systemPrompt  System prompt (template body + memory)
 * @param {string} opts.userMessage   Serialized event payload
 * @param {Array}  opts.tools         Tool definitions (e.g. [SUBMIT_ASSESSMENT_TOOL])
 * @param {string} [opts.model]       Model override; defaults to DEFAULT_MODEL
 * @returns {Promise<object>}         Raw Anthropic API response
 */
export async function callClaude({ systemPrompt, userMessage, tools, model }) {
  const resolvedModel = model ?? DEFAULT_MODEL;

  const apiCall = client.messages.create({
    model: resolvedModel,
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Claude API timeout after 30s')), TIMEOUT_MS)
  );

  try {
    return await Promise.race([apiCall, timeout]);
  } catch (err) {
    // Surface rate-limit errors with a recognisable message
    if (err?.status === 429) {
      throw new Error('Claude API rate limit');
    }
    throw err;
  }
}

export default callClaude;
