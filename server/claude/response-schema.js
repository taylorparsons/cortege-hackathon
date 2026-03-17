/**
 * Response schema and parsing for Claude agent responses.
 * Implements: FR-013, FR-014
 */

// ---------------------------------------------------------------------------
// Tool definition (from design doc section 4)
// ---------------------------------------------------------------------------

export const SUBMIT_ASSESSMENT_TOOL = {
  name: 'submit_assessment',
  description: 'Submit your threat assessment for the event you just evaluated.',
  input_schema: {
    type: 'object',
    required: [
      'event_id',
      'agent',
      'instance',
      'threat_level',
      'confidence',
      'assessment',
      'signals',
      'actions',
      'memory_updates',
      'stage_check',
    ],
    properties: {
      event_id: {
        type: 'string',
        description: 'ID of the event being assessed',
      },
      agent: {
        type: 'string',
        description: 'Agent type name (e.g., anchor)',
      },
      instance: {
        type: 'string',
        description: 'Agent instance ID (e.g., anchor-mom)',
      },
      threat_level: {
        type: 'integer',
        minimum: 0,
        maximum: 4,
        description: '0=normal, 1=low anomaly, 2=elevated, 3=high, 4=critical',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence in this assessment',
      },
      assessment: {
        type: 'string',
        description: 'Human-readable explanation of the assessment',
      },
      signals: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of signals that triggered this assessment',
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['log', 'monitor', 'soft_block', 'hard_block', 'escalate', 'log_evidence'],
            },
            target: { type: 'string' },
            level: { type: 'integer' },
            to: { type: 'string' },
            reason: { type: 'string' },
            summary: { type: 'string' },
          },
        },
      },
      memory_updates: {
        type: 'object',
        description: 'Memory update operations (see Memory Update Operations table)',
      },
      stage_check: {
        type: 'object',
        required: ['current_depth'],
        properties: {
          current_depth: { type: 'number' },
          stage_transition: { type: ['string', 'null'] },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Required fields for basic validation
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  'event_id',
  'agent',
  'instance',
  'threat_level',
  'confidence',
  'assessment',
  'signals',
  'actions',
  'memory_updates',
  'stage_check',
];

// ---------------------------------------------------------------------------
// parseAgentResponse
// ---------------------------------------------------------------------------

/**
 * Extracts and validates the AgentResponse from a raw Anthropic API response.
 *
 * @param {object} apiResponse  Raw response from client.messages.create
 * @returns {object}            Validated AgentResponse input object
 * @throws {Error}              If no tool_use block found or required fields missing
 */
export function parseAgentResponse(apiResponse) {
  const toolUseBlock = (apiResponse?.content ?? []).find(
    (block) => block.type === 'tool_use' && block.name === 'submit_assessment'
  );

  if (!toolUseBlock) {
    throw new Error('No submit_assessment tool_use in response');
  }

  const input = toolUseBlock.input;

  // Basic required-field validation
  const missing = REQUIRED_FIELDS.filter((f) => !(f in input));
  if (missing.length > 0) {
    throw new Error(`AgentResponse missing required fields: ${missing.join(', ')}`);
  }

  return input;
}

// ---------------------------------------------------------------------------
// validateAgentResponse
// ---------------------------------------------------------------------------

/**
 * Validates the semantic correctness of an AgentResponse.
 *
 * @param {object} response  Parsed AgentResponse
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentResponse(response) {
  const errors = [];

  if (!Number.isInteger(response.threat_level) || response.threat_level < 0 || response.threat_level > 4) {
    errors.push('threat_level must be integer 0-4');
  }

  if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
    errors.push('confidence must be number 0-1');
  }

  if (!Array.isArray(response.signals)) {
    errors.push('signals must be array');
  }

  if (!Array.isArray(response.actions)) {
    errors.push('actions must be array');
  }

  if (typeof response.memory_updates !== 'object' || Array.isArray(response.memory_updates)) {
    errors.push('memory_updates must be object');
  }

  if (!response.stage_check || typeof response.stage_check.current_depth === 'undefined') {
    errors.push('stage_check must have current_depth');
  }

  return { valid: errors.length === 0, errors };
}

export default { SUBMIT_ASSESSMENT_TOOL, parseAgentResponse, validateAgentResponse };
