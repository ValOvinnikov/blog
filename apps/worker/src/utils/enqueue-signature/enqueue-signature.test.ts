import { signEnqueuePayload } from '@worker/testing/enqueue/sign-enqueue-request';

import { isValidEnqueueSignature } from './enqueue-signature';

const SECRET = 'shared-secret';
const NOW = 1_700_000_000_000;
const BODY = '{"tenantId":"3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b"}';

function sign(secret: string, timestamp: string, rawBody: string): string {
  return signEnqueuePayload({ secret, timestamp, rawBody });
}

function validate(
  overrides: Partial<Parameters<typeof isValidEnqueueSignature>[0]> = {},
): boolean {
  const timestamp = String(NOW);
  return isValidEnqueueSignature({
    secret: SECRET,
    timestamp,
    signature: sign(SECRET, timestamp, BODY),
    rawBody: BODY,
    now: NOW,
    ...overrides,
  });
}

describe(isValidEnqueueSignature, () => {
  it('accepts a correctly signed, fresh request', () => {
    expect(validate()).toBe(true);
  });

  it('rejects a body changed after signing', () => {
    expect(validate({ rawBody: `${BODY} ` })).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    expect(
      validate({ signature: sign('other-secret', String(NOW), BODY) }),
    ).toBe(false);
  });

  it('rejects a signature reused with a different timestamp', () => {
    const signature = sign(SECRET, String(NOW), BODY);

    expect(validate({ timestamp: String(NOW + 1), signature })).toBe(false);
  });

  it.each([
    ['timestamp', { timestamp: null }],
    ['signature', { signature: null }],
    ['empty signature', { signature: '' }],
  ])('rejects a request missing its %s', (_label, overrides) => {
    expect(validate(overrides)).toBe(false);
  });

  it.each([
    ['without the prefix', sign(SECRET, String(NOW), BODY).slice(7)],
    ['truncated', sign(SECRET, String(NOW), BODY).slice(0, 20)],
    ['not hex', 'sha256=not-a-digest'],
  ])('rejects a malformed signature (%s)', (_label, signature) => {
    expect(validate({ signature })).toBe(false);
  });

  it('rejects a timestamp that is not an integer', () => {
    const timestamp = 'yesterday';

    expect(
      validate({ timestamp, signature: sign(SECRET, timestamp, BODY) }),
    ).toBe(false);
  });

  it.each([
    ['stale', NOW - 5 * 60_000 - 1],
    ['from the future', NOW + 5 * 60_000 + 1],
  ])('rejects a timestamp more than five minutes %s', (_label, sentAt) => {
    const timestamp = String(sentAt);

    expect(
      validate({ timestamp, signature: sign(SECRET, timestamp, BODY) }),
    ).toBe(false);
  });

  it('accepts a timestamp exactly five minutes old', () => {
    const timestamp = String(NOW - 5 * 60_000);

    expect(
      validate({ timestamp, signature: sign(SECRET, timestamp, BODY) }),
    ).toBe(true);
  });
});
