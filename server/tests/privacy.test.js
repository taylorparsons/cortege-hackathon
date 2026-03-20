import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aliasFromValue,
  decryptString,
  encryptLocationForStorage,
  encryptMemberForStorage,
  encryptString,
  isEncryptedField,
  normalizePhone,
  redactForLogs,
  sanitizeEventForLLM,
  sanitizeMemoryForLLM,
  tokenizeValue,
} from '../privacy/pii.js';

describe('privacy helpers', () => {
  test('encryptString/decryptString round-trips plaintext', () => {
    const encrypted = encryptString('Alice Example');

    assert.equal(isEncryptedField(encrypted), true);
    assert.equal(decryptString(encrypted), 'Alice Example');
  });

  test('tokenizeValue is deterministic for the same phone', () => {
    const phone = normalizePhone('+1 (415) 555-0123');

    assert.equal(tokenizeValue('phone', phone), tokenizeValue('phone', phone));
    assert.notEqual(
      tokenizeValue('phone', phone),
      tokenizeValue('phone', normalizePhone('+1 (415) 555-9999'))
    );
  });

  test('encryptMemberForStorage does not persist cleartext name, phone, or dob', () => {
    const member = encryptMemberForStorage({
      id: 'member_123',
      name: 'Alice Example',
      phone: '+14155550123',
      date_of_birth: '1980-04-12',
      profile_type: 'adult',
      companion: 'sentinel',
    });

    const serialized = JSON.stringify(member);

    assert.equal(serialized.includes('Alice Example'), false);
    assert.equal(serialized.includes('+14155550123'), false);
    assert.equal(serialized.includes('1980-04-12'), false);
    assert.ok(member.phone_token);
  });

  test('encryptLocationForStorage does not persist cleartext name or address', () => {
    const location = encryptLocationForStorage({
      location_id: 'loc_123',
      name: 'Home',
      address: {
        line1: '123 Main St',
        line2: null,
        city: 'Austin',
        region: 'TX',
        postal_code: '78701',
        country: 'US',
      },
      created: '2026-03-20T00:00:00.000Z',
    });

    const serialized = JSON.stringify(location);

    assert.equal(serialized.includes('Home'), false);
    assert.equal(serialized.includes('123 Main St'), false);
    assert.equal(serialized.includes('Austin'), false);
  });

  test('sanitizeEventForLLM removes raw member and location identifiers', () => {
    const safe = sanitizeEventForLLM(
      {
        type: 'inbound_call',
        id: 'evt_123',
        timestamp: '2026-03-20T00:00:00.000Z',
        payload: {
          from: '+14155550123',
          transcript: 'Alice Example at 123 Main St asked to call +14155550123 on 1980-04-12.',
        },
      },
      {
        member: {
          id: 'member_123',
          name: 'Alice Example',
          phone: '+14155550123',
          date_of_birth: '1980-04-12',
        },
        location: {
          name: 'Home',
          address: {
            line1: '123 Main St',
            city: 'Austin',
            region: 'TX',
            postal_code: '78701',
            country: 'US',
          },
        },
      }
    );

    const serialized = JSON.stringify(safe);

    assert.equal(serialized.includes('Alice Example'), false);
    assert.equal(serialized.includes('+14155550123'), false);
    assert.equal(serialized.includes('123 Main St'), false);
    assert.equal(serialized.includes('1980-04-12'), false);
    assert.equal(safe.payload.from, aliasFromValue('phone', '+14155550123'));
  });

  test('redactForLogs masks direct phone, dob, and address fields', () => {
    const safe = redactForLogs({
      name: 'Alice Example',
      phone: '+14155550123',
      date_of_birth: '1980-04-12',
      address: {
        line1: '123 Main St',
        city: 'Austin',
      },
      summary: 'Alice Example called from +14155550123',
    });

    assert.match(safe.name, /^NAME_NAME_/);
    assert.match(safe.phone, /^PHONE_/);
    assert.equal(safe.date_of_birth, '[DATE_OF_BIRTH]');
    assert.equal(safe.address, '[ADDRESS]');
    assert.equal(safe.summary.includes('Alice Example'), false);
    assert.equal(safe.summary.includes('+14155550123'), false);
  });

  test('sanitizeMemoryForLLM aliases contacts and drops raw trusted-contact names', () => {
    const safe = sanitizeMemoryForLLM({
      stage: 'baseline',
      depth_score: 0.1,
      events_processed: 1,
      baseline_period_days: 30,
      trusted_contacts: {
        '+14155550123': {
          name: 'Alice Example',
          relationship: 'daughter',
          confidence: 0.9,
        },
      },
      blocked_contacts: {
        '+14155550999': {
          name: 'Scam Caller',
          reason: 'Asked for gift cards',
        },
      },
      learned_patterns: [
        { key: 'quiet_hours', observation: 'Alice Example does not answer late calls.' },
      ],
      threat_history: [],
    });

    const serialized = JSON.stringify(safe);

    assert.equal(serialized.includes('Alice Example'), false);
    assert.equal(serialized.includes('+14155550123'), false);
    assert.equal(safe.trusted_contacts[0].relationship, 'daughter');
    assert.match(safe.trusted_contacts[0].contact_ref, /^CONTACT_/);
    assert.match(safe.blocked_contacts[0].contact_ref, /^CONTACT_/);
  });
});
