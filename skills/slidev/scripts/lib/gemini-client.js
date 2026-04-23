// gemini-client.js — Google Gemini 2.5 Flash Image API client (REST).
// Exports a real `generateImage` and a test factory `createMockClient`.
//
// The --mock <scenario> flag on generate-images.js activates createMockClient.
// Documented in SKILL.md §SP2 "Testing & Mock" and references/image-generation.md §9.
// If you're looking for how to control which client is used at runtime, see
// generate-images.js's argv parsing of --mock.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.retryable = code === 'network';
  }
}

// Minimal 1x1 PNG for tests (hand-crafted signature + IHDR + IDAT + IEND)
const MOCK_PNG_1x1 = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,                          // signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,                          // IHDR
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,                          // 1x1
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,                    // bit depth/color type/CRC
  0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8,  // IDAT
  0xCF, 0xC0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x5B, 0xE4, 0x7B, 0x31,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,  // IEND
]);

export async function generateImage({ prompt, width, height, apiKey, timeoutMs = 30000 }) {
  if (!apiKey) throw new GeminiError('api', 'apiKey missing');

  const url = `${ENDPOINT_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new GeminiError('timeout', `API timeout (${timeoutMs}ms)`);
    }
    throw new GeminiError('network', `network error: ${err.message}`);
  }
  clearTimeout(timer);

  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 200);
    throw new GeminiError('api', `HTTP ${response.status}: ${snippet}`);
  }

  const payload = await response.json();

  // Safety blocks
  const block = payload?.promptFeedback?.blockReason;
  if (block) throw new GeminiError('content_policy', `Prompt blocked: ${block}`);

  const candidate = payload?.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
    throw new GeminiError('content_policy', `Finish reason: ${candidate.finishReason}`);
  }

  // Find first inline image part
  const parts = candidate?.content?.parts || [];
  for (const p of parts) {
    if (p.inlineData && p.inlineData.data) {
      return Buffer.from(p.inlineData.data, 'base64');
    }
  }
  throw new GeminiError('api', 'No image part in response');
}

const VALID_SCENARIOS = ['success', 'timeout', 'content_policy', 'network', 'api'];

export function createMockClient(scenario) {
  if (!VALID_SCENARIOS.includes(scenario)) {
    throw new Error(`Unknown mock scenario: ${scenario}. Expected one of: ${VALID_SCENARIOS.join(', ')}`);
  }
  return {
    async generateImage({ prompt, width, height }) {
      if (scenario === 'success') return MOCK_PNG_1x1;
      throw new GeminiError(scenario, `mock ${scenario}`);
    },
  };
}
