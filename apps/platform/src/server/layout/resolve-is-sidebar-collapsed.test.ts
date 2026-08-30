import { resolveIsSidebarCollapsed } from './resolve-is-sidebar-collapsed';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

describe(resolveIsSidebarCollapsed, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it('resolves false when the cookie is absent', async () => {
    mockCookie(undefined);

    expect(await resolveIsSidebarCollapsed()).toBe(false);
  });

  it('resolves false for any value other than the literal string "true"', async () => {
    mockCookie('1');

    expect(await resolveIsSidebarCollapsed()).toBe(false);
  });

  it('resolves true when the cookie is set to "true"', async () => {
    mockCookie('true');

    expect(await resolveIsSidebarCollapsed()).toBe(true);
  });
});
