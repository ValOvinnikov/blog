import { NEXT_NAVIGATION_ERROR } from '@shinefold/config/constants';

export const createNextNavigationMock = () => ({
  notFound: vi.fn(() => {
    throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  }),
  redirect: vi.fn(() => {
    throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
  }),
  unstable_isUnrecognizedActionError: vi.fn(() => false),
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
});
