import { isMagicLinkSendAllowed } from './is-magic-link-send-allowed';

const { incrementMagicLinkSendCountMock } = vi.hoisted(() => ({
  incrementMagicLinkSendCountMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    magicLinkSendCounters: {
      incrementMagicLinkSendCount: incrementMagicLinkSendCountMock,
    },
  },
}));

const EMAIL = 'owner@example.com';
const CLIENT_IP = '203.0.113.5';

const requestFrom = (ip: string) =>
  new Request('https://platform.example.com/api/auth/signin/email', {
    headers: { 'x-forwarded-for': ip },
  });

const withSendCounts = ({ email, ip }: { email: number; ip: number }) => {
  incrementMagicLinkSendCountMock.mockImplementation((key: string) =>
    Promise.resolve(key.startsWith('email:') ? email : ip),
  );
};

describe(isMagicLinkSendAllowed, () => {
  it('allows a send within both limits', async () => {
    withSendCounts({ email: 5, ip: 20 });

    const result = await isMagicLinkSendAllowed(EMAIL, requestFrom(CLIENT_IP));

    expect(result).toBe(true);
  });

  it('refuses a send over the per-email limit', async () => {
    withSendCounts({ email: 6, ip: 1 });

    const result = await isMagicLinkSendAllowed(EMAIL, requestFrom(CLIENT_IP));

    expect(result).toBe(false);
  });

  it('refuses a send over the per-IP limit', async () => {
    withSendCounts({ email: 1, ip: 21 });

    const result = await isMagicLinkSendAllowed(EMAIL, requestFrom(CLIENT_IP));

    expect(result).toBe(false);
  });

  it('counts the same email under the same key whatever its case', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await isMagicLinkSendAllowed(EMAIL, requestFrom(CLIENT_IP));
    await isMagicLinkSendAllowed('Owner@Example.com', requestFrom(CLIENT_IP));

    const keys = incrementMagicLinkSendCountMock.mock.calls.map(([key]) => key);
    expect(keys[2]).toBe(keys[0]);
  });

  it('stores neither the email nor the IP in a counter key', async () => {
    withSendCounts({ email: 1, ip: 1 });

    await isMagicLinkSendAllowed(EMAIL, requestFrom(CLIENT_IP));

    const keys = incrementMagicLinkSendCountMock.mock.calls.map(([key]) => key);
    expect(keys.join()).not.toMatch(/owner@example\.com|203\.0\.113\.5/);
  });
});
