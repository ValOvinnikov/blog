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
      'names the user by their name when the session has one',
      sessionFor({ name: MOCK_USER_NAME, email: MOCK_USER_EMAIL }),
      MOCK_USER_NAME,
    ],
    [
      'falls back to the email when the session user has no name',
      sessionFor({ email: MOCK_USER_EMAIL }),
      MOCK_USER_EMAIL,
    ],
    ['leaves the user unnamed without a session', null, undefined],
  ])('%s', async (_title, session, expectedUserName) => {
    authMock.mockResolvedValueOnce(session);

    const { userName } = await loadAdminShellChrome();

    expect(userName).toBe(expectedUserName);
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
