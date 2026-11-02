import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { makeEnTranslator } from '@platform/testing/en-translator';
import type { Session } from 'next-auth';

import { loadAdminShellChrome } from './load-admin-shell-chrome';

faker.seed(5998);

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('@platform/server/auth/auth');
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const MOCK_USER_ID = faker.string.uuid();
const MOCK_USER_NAME = faker.person.fullName();
const MOCK_USER_EMAIL = faker.internet.email();
const MOCK_SESSION_EXPIRES = faker.date.future().toISOString();
const NAV_SECTIONS_KEY = 'tenants';

const authMock = vi.mocked<() => Promise<Session | null>>(auth);

const sessionFor = (user: { name?: string; email: string }) => ({
  user: { id: MOCK_USER_ID, ...user },
  expires: MOCK_SESSION_EXPIRES,
});

describe(loadAdminShellChrome, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue({ get: vi.fn(() => ({ value: 'true' })) });
  });

  it.each([
    [
      'carries the name and the email separately',
      sessionFor({ name: MOCK_USER_NAME, email: MOCK_USER_EMAIL }),
      { userName: MOCK_USER_NAME, userEmail: MOCK_USER_EMAIL },
    ],
    [
      'leaves the name unset when the session user has none',
      sessionFor({ email: MOCK_USER_EMAIL }),
      { userName: undefined, userEmail: MOCK_USER_EMAIL },
    ],
    [
      'leaves both unset without a session',
      null,
      { userName: undefined, userEmail: undefined },
    ],
  ])('%s', async (_title, session, expected) => {
    authMock.mockResolvedValueOnce(session);

    const { userName, userEmail } = await loadAdminShellChrome();

    expect({ userName, userEmail }).toEqual(expected);
  });

  it('carries the sidebar preference and the nav translator', async () => {
    const { isSidebarInitiallyCollapsed, tNavSections } =
      await loadAdminShellChrome();

    expect(isSidebarInitiallyCollapsed).toBe(true);
    expect(tNavSections(NAV_SECTIONS_KEY)).toBe(
      makeEnTranslator('navSections')(NAV_SECTIONS_KEY),
    );
  });
});
