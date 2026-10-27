import { faker } from '@faker-js/faker';

import {
  buildEnqueueHeaders,
  ENQUEUE_MAX_AGE_MS,
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
  signEnqueuePayload,
} from './enqueue-signature';

faker.seed(6029);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(32);
const MOCK_NOW = 1_700_000_000_000;
const MOCK_TIMESTAMP = String(MOCK_NOW);
const MOCK_BODY = JSON.stringify({ tenantId: faker.string.uuid() });
const MOCK_PATH = `/api/${faker.lorem.slug()}`;
const MOCK_OTHER_PATH = `/api/${faker.lorem.slug()}`;

function sign(
  timestamp: string = MOCK_TIMESTAMP,
  secret: string = MOCK_SECRET,
): string {
  return signEnqueuePayload({
    secret,
    timestamp,
    path: MOCK_PATH,
    rawBody: MOCK_BODY,
  });
}

function validate(
  overrides: Partial<Parameters<typeof isValidEnqueueSignature>[0]> = {},
): boolean {
  return isValidEnqueueSignature({
    secret: MOCK_SECRET,
    timestamp: MOCK_TIMESTAMP,
    signature: sign(),
    path: MOCK_PATH,
    rawBody: MOCK_BODY,
    now: MOCK_NOW,
    ...overrides,
  });
}

function validateSentAt(timestamp: string): boolean {
  return validate({ timestamp, signature: sign(timestamp) });
}

describe(isValidEnqueueSignature, () => {
  it('accepts a correctly signed, fresh request', () => {
    expect(validate()).toBe(true);
  });

  it('rejects a body changed after signing', () => {
    expect(validate({ rawBody: `${MOCK_BODY} ` })).toBe(false);
  });

  it('rejects a signature replayed against another route', () => {
    expect(validate({ path: MOCK_OTHER_PATH })).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    const signature = sign(MOCK_TIMESTAMP, MOCK_OTHER_SECRET);

    expect(validate({ signature })).toBe(false);
  });

  it('rejects a signature reused with a different timestamp', () => {
    expect(validate({ timestamp: String(MOCK_NOW + 1) })).toBe(false);
  });

  it.each([
    ['timestamp', { timestamp: null }],
    ['signature', { signature: null }],
    ['empty signature', { signature: '' }],
  ])('rejects a request missing its %s', (_label, overrides) => {
    expect(validate(overrides)).toBe(false);
  });

  it.each([
    ['without the prefix', sign().slice(7)],
    ['truncated', sign().slice(0, 20)],
    ['not hex', 'sha256=not-a-digest'],
  ])('rejects a malformed signature (%s)', (_label, signature) => {
    expect(validate({ signature })).toBe(false);
  });

  it.each([
    ['that is not an integer', 'yesterday'],
    ['more than five minutes stale', String(MOCK_NOW - ENQUEUE_MAX_AGE_MS - 1)],
    [
      'more than five minutes in the future',
      String(MOCK_NOW + ENQUEUE_MAX_AGE_MS + 1),
    ],
  ])('rejects a timestamp %s', (_label, timestamp) => {
    expect(validateSentAt(timestamp)).toBe(false);
  });

  it('accepts a timestamp exactly five minutes old', () => {
    expect(validateSentAt(String(MOCK_NOW - ENQUEUE_MAX_AGE_MS))).toBe(true);
  });
});

describe(buildEnqueueHeaders, () => {
  it('produces headers the verifier accepts for the same path and body', () => {
    const headers = buildEnqueueHeaders({
      secret: MOCK_SECRET,
      path: MOCK_PATH,
      rawBody: MOCK_BODY,
      now: MOCK_NOW,
    });

    const isValid = validate({
      timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
      signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
    });

    expect(isValid).toBe(true);
  });
});
