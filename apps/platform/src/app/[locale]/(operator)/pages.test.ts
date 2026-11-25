import { requireAdmin } from '@platform/server/auth/require-admin';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/auth/require-admin');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {},
}));

const pages = import.meta.glob<{
  default: (props: Record<string, unknown>) => Promise<unknown>;
}>('./**/page.tsx');

const gateCallCount = () =>
  vi.mocked(requireAdmin).mock.calls.length +
  vi.mocked(requireSuperAdmin).mock.calls.length;

const MOCK_PAGE_PROPS = {
  params: Promise.resolve({}),
  searchParams: Promise.resolve({}),
};

describe('operator pages', () => {
  beforeEach(() => {
    vi.stubEnv('SKIP_ENV_VALIDATION', 'true');
    const refuse = async () => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    };
    vi.mocked(requireAdmin).mockImplementation(refuse);
    vi.mocked(requireSuperAdmin).mockImplementation(refuse);
  });

  it.each(Object.keys(pages))(
    '%s refuses a removed admin without relying on the layout',
    async (path) => {
      const { default: Page } = await pages[path]!();

      await expect(Page(MOCK_PAGE_PROPS)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
      expect(gateCallCount()).toBeGreaterThan(0);
    },
  );
});
