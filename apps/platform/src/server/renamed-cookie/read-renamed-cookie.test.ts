import { readRenamedCookie } from './read-renamed-cookie';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const MOCK_COOKIE = { name: 'current', legacyName: 'legacy' };
const MOCK_CURRENT_VALUE = 'current-value';
const MOCK_LEGACY_VALUE = 'legacy-value';

const mockCookies = (stored: Partial<Record<string, string>>) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) =>
      name in stored ? { value: stored[name] } : undefined,
    ),
  });
};

describe(readRenamedCookie, () => {
  it('reads the current name first', async () => {
    mockCookies({
      [MOCK_COOKIE.name]: MOCK_CURRENT_VALUE,
      [MOCK_COOKIE.legacyName]: MOCK_LEGACY_VALUE,
    });

    expect(await readRenamedCookie(MOCK_COOKIE)).toBe(MOCK_CURRENT_VALUE);
  });

  it('falls back to the legacy name', async () => {
    mockCookies({ [MOCK_COOKIE.legacyName]: MOCK_LEGACY_VALUE });

    expect(await readRenamedCookie(MOCK_COOKIE)).toBe(MOCK_LEGACY_VALUE);
  });

  it('resolves undefined when neither is set', async () => {
    mockCookies({});

    expect(await readRenamedCookie(MOCK_COOKIE)).toBeUndefined();
  });
});
