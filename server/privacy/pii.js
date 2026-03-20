import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';

const DEV_MASTER_KEY = 'cortege-dev-pii-key-not-for-production';
const ENC_ALG = 'aes-256-gcm';
const TEXT_KEYS = new Set([
  'content',
  'text',
  'message',
  'body',
  'summary',
  'assessment',
  'reason',
  'description',
  'note',
  'transcription',
]);

function pushReplacement(replacements, raw, replacement) {
  if (raw === undefined || raw === null || raw === '') return;
  replacements.push({ raw: String(raw), replacement });
}

function getMasterSecret() {
  const configured = process.env.PII_MASTER_KEY;
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PII_MASTER_KEY is required in production');
  }
  if (!getMasterSecret._warned) {
    console.warn('[privacy] PII_MASTER_KEY not set; using dev-only fallback key');
    getMasterSecret._warned = true;
  }
  return DEV_MASTER_KEY;
}

function deriveKey(label) {
  return createHash('sha256').update(`${label}:${getMasterSecret()}`).digest();
}

export function isEncryptedField(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.alg === ENC_ALG &&
    typeof value.iv === 'string' &&
    typeof value.tag === 'string' &&
    typeof value.ciphertext === 'string'
  );
}

export function ensurePiiReady() {
  getMasterSecret();
}

export function encryptString(value) {
  if (value === undefined || value === null || value === '') return null;
  if (isEncryptedField(value)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ENC_ALG, deriveKey('enc'), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);

  return {
    alg: ENC_ALG,
    kid: process.env.PII_MASTER_KEY ? 'env-v1' : 'dev-v1',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptString(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  if (!isEncryptedField(value)) return value;

  const decipher = createDecipheriv(
    ENC_ALG,
    deriveKey('enc'),
    Buffer.from(value.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

export function encryptJson(value) {
  if (value === undefined || value === null) return null;
  return encryptString(JSON.stringify(value));
}

export function decryptJson(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && !isEncryptedField(value)) return value;
  const plaintext = decryptString(value);
  return plaintext ? JSON.parse(plaintext) : null;
}

export function tokenizeValue(kind, value) {
  if (value === undefined || value === null || value === '') return null;
  const digest = createHmac('sha256', deriveKey('tok'))
    .update(`${kind}:${String(value)}`)
    .digest('hex')
    .slice(0, 16);
  return `tok_${kind}_${digest}`;
}

export function aliasFromValue(kind, value) {
  const token = String(value ?? '');
  const ref = token.startsWith('tok_') ? token : tokenizeValue(kind, token);
  return `${kind.toUpperCase()}_${ref.slice(-8).toUpperCase()}`;
}

export function normalizePhone(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : trimmed.replace(/\D/g, '');
}

export function isValidE164(value) {
  const normalized = normalizePhone(value);
  return /^\+[1-9]\d{7,14}$/.test(normalized ?? '');
}

export function isValidDateOfBirth(value) {
  if (value === undefined || value === null || value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectContextReplacements(context = {}) {
  const replacements = [...(context.replacements ?? [])];
  const member = context.member ?? null;
  const location = context.location ?? null;

  if (member?.name) {
    pushReplacement(
      replacements,
      member.name,
      `MEMBER_${member.id ?? aliasFromValue('member', member.name)}`
    );
  }
  if (member?.phone) {
    pushReplacement(
      replacements,
      member.phone,
      aliasFromValue('phone', normalizePhone(member.phone))
    );
  }
  if (member?.date_of_birth) {
    pushReplacement(replacements, member.date_of_birth, '[DATE_OF_BIRTH]');
  }
  if (location?.name) {
    pushReplacement(replacements, location.name, '[LOCATION]');
  }
  if (location?.address && typeof location.address === 'object') {
    for (const part of Object.values(location.address)) {
      pushReplacement(replacements, part, '[ADDRESS]');
    }
  }

  return replacements;
}

function inferContextFromObject(value, context = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return context;

  const replacements = [...(context.replacements ?? [])];
  const inferredMember = { ...(context.member ?? {}) };
  const inferredLocation = { ...(context.location ?? {}) };

  if (typeof value.name === 'string' && value.name) {
    inferredMember.name ??= value.name;
    pushReplacement(replacements, value.name, `NAME_${aliasFromValue('name', value.name)}`);
  }
  if (typeof value.phone === 'string' && value.phone) {
    const normalized = normalizePhone(value.phone);
    inferredMember.phone ??= normalized;
    pushReplacement(replacements, value.phone, aliasFromValue('phone', normalized));
  }
  if (typeof value.from === 'string' && value.from) {
    pushReplacement(
      replacements,
      value.from,
      aliasFromValue('phone', normalizePhone(value.from))
    );
  }
  if (typeof value.to === 'string' && value.to) {
    pushReplacement(
      replacements,
      value.to,
      aliasFromValue('phone', normalizePhone(value.to))
    );
  }
  if (typeof value.date_of_birth === 'string' && value.date_of_birth) {
    inferredMember.date_of_birth ??= value.date_of_birth;
    pushReplacement(replacements, value.date_of_birth, '[DATE_OF_BIRTH]');
  }
  if (value.address && typeof value.address === 'object' && !Array.isArray(value.address)) {
    inferredLocation.address ??= value.address;
    for (const part of Object.values(value.address)) {
      pushReplacement(replacements, part, '[ADDRESS]');
    }
  }

  return {
    ...context,
    replacements,
    member: Object.keys(inferredMember).length > 0 ? inferredMember : context.member,
    location: Object.keys(inferredLocation).length > 0 ? inferredLocation : context.location,
  };
}

export function sanitizeString(value, context = {}) {
  if (value === undefined || value === null) return value;
  let output = String(value);

  for (const { raw, replacement } of collectContextReplacements(context)) {
    output = output.replace(new RegExp(escapeRegex(raw), 'g'), replacement);
  }

  output = output
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[PHONE]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID]');

  return output;
}

function sanitizeValue(key, value, context = {}) {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(key, item, context));
  if (typeof value === 'object') return redactForLogs(value, context);

  if (key === 'name') return `NAME_${aliasFromValue('name', value)}`;
  if (key === 'phone' || key === 'from' || key === 'to' || key === 'caller_id') {
    return aliasFromValue('phone', normalizePhone(value));
  }
  if (key === 'date_of_birth' || key === 'dob' || key === 'birthdate') return '[DATE_OF_BIRTH]';
  if (key === 'address') return '[ADDRESS]';
  if (TEXT_KEYS.has(key)) return sanitizeString(value, context);
  return sanitizeString(value, context);
}

export function redactForLogs(value, context = {}) {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => redactForLogs(item, context));
  if (typeof value !== 'object') return sanitizeString(value, context);

  const nestedContext = inferContextFromObject(value, context);
  const result = {};
  for (const [key, current] of Object.entries(value)) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      result[key] = key === 'address' ? '[ADDRESS]' : redactForLogs(current, nestedContext);
    } else {
      result[key] = sanitizeValue(key, current, nestedContext);
    }
  }
  return result;
}

export function sanitizeEventForLLM(event, context = {}) {
  return {
    event_type: event.type,
    event_id: event.id,
    timestamp: event.timestamp,
    payload: redactForLogs(event.payload ?? {}, context),
  };
}

export function sanitizeMemoryForLLM(memory, context = {}) {
  if (!memory || typeof memory !== 'object') return {};

  const memoryContext = inferContextFromObject(
    {
      trusted_contacts: memory.trusted_contacts,
      blocked_contacts: memory.blocked_contacts,
    },
    {
      ...context,
      replacements: [...(context.replacements ?? [])],
    }
  );

  for (const [id, contact] of Object.entries(memory.trusted_contacts ?? {})) {
    pushReplacement(
      memoryContext.replacements,
      id,
      aliasFromValue('contact', id)
    );
    pushReplacement(
      memoryContext.replacements,
      contact?.name,
      aliasFromValue('contact', id)
    );
  }

  for (const [id, contact] of Object.entries(memory.blocked_contacts ?? {})) {
    pushReplacement(
      memoryContext.replacements,
      id,
      aliasFromValue('contact', id)
    );
    pushReplacement(
      memoryContext.replacements,
      contact?.name,
      aliasFromValue('contact', id)
    );
  }

  const safe = {
    stage: memory.stage,
    depth_score: memory.depth_score,
    events_processed: memory.events_processed,
    baseline_period_days: memory.baseline_period_days,
    trusted_contacts: [],
    blocked_contacts: [],
    learned_patterns: (memory.learned_patterns ?? []).map((pattern) => ({
      key: pattern.key,
      observation: sanitizeString(pattern.observation ?? '', memoryContext),
      confidence: pattern.confidence ?? null,
    })),
    threat_history: (memory.threat_history ?? []).map((entry) => ({
      timestamp: entry.timestamp,
      pattern: sanitizeString(entry.pattern ?? '', memoryContext),
      signals: entry.signals ?? [],
      source: entry.source,
      threat_level: entry.threat_level,
    })),
  };

  for (const [id, contact] of Object.entries(memory.trusted_contacts ?? {})) {
    safe.trusted_contacts.push({
      contact_ref: aliasFromValue('contact', id),
      relationship: contact.relationship ?? null,
      confidence: contact.confidence ?? null,
    });
  }

  for (const [id, contact] of Object.entries(memory.blocked_contacts ?? {})) {
    safe.blocked_contacts.push({
      contact_ref: aliasFromValue('contact', id),
      reason: sanitizeString(contact.reason ?? '', memoryContext),
    });
  }

  return safe;
}

export function encryptMemberForStorage(member) {
  const phone = normalizePhone(member.phone);
  return {
    id: member.id,
    name_enc: encryptString(member.name),
    phone_enc: encryptString(phone),
    phone_token: phone ? tokenizeValue('phone', phone) : null,
    date_of_birth_enc: encryptString(member.date_of_birth ?? null),
    profile_type: member.profile_type,
    companion: member.companion,
    is_primary: member.is_primary ?? false,
    primary_contact: member.primary_contact ?? null,
  };
}

export function decryptMemberFromStorage(raw) {
  return {
    id: raw.id,
    name: decryptString(raw.name_enc ?? raw.name ?? null),
    phone: decryptString(raw.phone_enc ?? raw.phone ?? null),
    date_of_birth: decryptString(raw.date_of_birth_enc ?? raw.date_of_birth ?? null),
    profile_type: raw.profile_type,
    companion: raw.companion,
    is_primary: raw.is_primary ?? false,
    primary_contact: raw.primary_contact ?? null,
    age: raw.age ?? null,
  };
}

export function encryptLocationForStorage(location) {
  return {
    location_id: location.location_id,
    name_enc: encryptString(location.name),
    address_enc: encryptJson(location.address),
    created: location.created,
    updated_at: location.updated_at ?? null,
  };
}

export function formatAddressSummary(address) {
  if (!address || typeof address !== 'object') return null;
  const parts = [address.city, address.region, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : address.line1 ?? null;
}

export function decryptLocationFromStorage(raw) {
  const address = decryptJson(raw.address_enc ?? raw.address ?? null);
  return {
    location_id: raw.location_id,
    name: decryptString(raw.name_enc ?? raw.name ?? null),
    address,
    address_summary: formatAddressSummary(address),
    created: raw.created,
    updated_at: raw.updated_at ?? null,
  };
}

export function encryptHouseholdName(name) {
  return encryptString(name);
}

export function decryptHouseholdName(raw) {
  return decryptString(raw.name_enc ?? raw.name ?? null);
}
