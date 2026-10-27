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

  it.each([
    { cookie: 'absent', value: undefined, expected: false },
    { cookie: 'anything other than "true"', value: '1', expected: false },
    { cookie: '"true"', value: 'true', expected: true },
  ])(
    'resolves $expected when the cookie is $cookie',
    async ({ value, expected }) => {
      mockCookie(value);

      expect(await resolveIsSidebarCollapsed()).toBe(expected);
    },
  );
});
