#!/usr/bin/env node
import { createMockClient, GeminiError } from './gemini-client.js';

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
};

// Test: GeminiError class
const e = new GeminiError('timeout', 'mock msg');
assert(e instanceof Error, 'GeminiError extends Error');
assert(e.code === 'timeout', 'code captured');
assert(e.message === 'mock msg', 'message captured');

// Test: mock success
const mockOk = createMockClient('success');
const buf = await mockOk.generateImage({ prompt: 'x', width: 100, height: 100 });
assert(Buffer.isBuffer(buf), 'mock success returns Buffer');
assert(buf.length > 0, 'buffer non-empty');
// Must be a valid PNG signature
assert(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47, 'PNG signature');

// Test: mock timeout throws
try {
  const m = createMockClient('timeout');
  await m.generateImage({ prompt: 'x', width: 100, height: 100 });
  console.error('FAIL: expected throw');
  process.exit(1);
} catch (err) {
  assert(err instanceof GeminiError, 'throws GeminiError');
  assert(err.code === 'timeout', 'timeout code');
}

// Test: mock content_policy
try {
  await createMockClient('content_policy').generateImage({ prompt: 'x', width: 1, height: 1 });
  console.error('FAIL: expected throw');
  process.exit(1);
} catch (err) {
  assert(err.code === 'content_policy', 'content_policy code');
}

// Test: mock network / api
try { await createMockClient('network').generateImage({ prompt: 'x', width: 1, height: 1 }); process.exit(1); }
catch (err) { assert(err.code === 'network', 'network code'); }
try { await createMockClient('api').generateImage({ prompt: 'x', width: 1, height: 1 }); process.exit(1); }
catch (err) { assert(err.code === 'api', 'api code'); }

// Test: unknown scenario → throws
try { createMockClient('bogus'); console.error('FAIL: unknown scenario'); process.exit(1); }
catch (err) { assert(err.message.includes('bogus'), 'unknown scenario rejected'); }

console.log('\nAll assertions passed.');
