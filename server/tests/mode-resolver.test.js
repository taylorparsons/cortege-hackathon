import { describe, test } from 'node:test';
import assert from 'node:assert';
import { ModeResolver } from '../warden/mode-resolver.js';

describe('ModeResolver', () => {
  test('user override true forces headed mode', () => {
    const job = { headedOverride: true };
    const broker = { requires_headed_mode: false };
    assert.strictEqual(ModeResolver.resolve(job, broker, false), 'headed');
  });

  test('user override false forces headless mode', () => {
    const job = { headedOverride: false };
    const broker = { requires_headed_mode: true };
    assert.strictEqual(ModeResolver.resolve(job, broker, true), 'headless');
  });

  test('broker config headed when no override', () => {
    const job = {};
    const broker = { requires_headed_mode: true };
    assert.strictEqual(ModeResolver.resolve(job, broker, false), 'headed');
  });

  test('broker config headless when no override', () => {
    const job = {};
    const broker = { requires_headed_mode: false };
    assert.strictEqual(ModeResolver.resolve(job, broker, true), 'headless');
  });

  test('env var headed when no override or broker config', () => {
    const job = {};
    const broker = {};
    assert.strictEqual(ModeResolver.resolve(job, broker, true), 'headed');
  });

  test('defaults to headless when no config', () => {
    const job = {};
    const broker = {};
    assert.strictEqual(ModeResolver.resolve(job, broker, false), 'headless');
  });

  test('logs deprecation warning when using env var', () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);
    
    const job = {};
    const broker = {};
    ModeResolver.resolve(job, broker, true);
    
    console.warn = originalWarn;
    assert.ok(warnings.some(w => w.includes('deprecated WARDEN_HEADED_MODE')));
  });
});
