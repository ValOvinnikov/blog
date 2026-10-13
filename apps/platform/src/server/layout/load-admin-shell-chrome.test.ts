import { auth } from '@platform/server/auth/auth';
import type { Session } from 'next-auth';

import { loadAdminShellChrome } from './load-admin-shell-chrome';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('@platform/server/auth/auth');
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => `navSections.${key}`),
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(loadAdminShellChrome, () => {
  beforeEach(() => {
    authMock.mockReset();
    cookiesMock.mockResolvedValue({ get: vi.fn(() => ({ value: 'true' })) });
  });

  it('names the user by their name when the session has one', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Ada', email: 'ada@example.com' },
    });

    const { userName } = await loadAdminShellChrome();

    expect(userName).toBe('Ada');
  });

  it('falls back to the email when the session user has no name', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: 'ada@example.com' },
    });

    const { userName } = await loadAdminShellChrome();

    expect(userName).toBe('ada@example.com');
  });

  it('leaves the user unnamed without a session', async () => {
    authMock.mockResolvedValue(null);

    const { userName } = await loadAdminShellChrome();

    expect(userName).toBeUndefined();
  });

  it('carries the sidebar preference and the nav translator', async () => {
    authMock.mockResolvedValue(null);

    const { isSidebarInitiallyCollapsed, tNavSections } =
      await loadAdminShellChrome();

    expect(isSidebarInitiallyCollapsed).toBe(true);
    expect(tNavSections('tenants')).toBe('navSections.tenants');
  });
});
