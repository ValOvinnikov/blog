import { CAPABILITY, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SESSION_STATUS } from '@web/constants/session';
import { ToastProvider } from '@web/context/toast-provider';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  customRenderServerAsync,
  screen,
  waitFor,
} from '@web/testing/custom-render';
import { MOCK_SUSPENDED_TENANT } from '@web/testing/shared/tenant/fixtures';
import { useSession } from 'next-auth/react';

import { BookmarkButtonGate } from './bookmark-button-gate';

faker.seed(5776);

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/bookmarks/bookmark-actions/bookmark-actions', () => ({
  getBookmarkStatus: vi.fn(),
  setBookmarkStatus: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

const MOCK_POST_ID = faker.string.uuid();

const { saveAriaLabel } = SITE_MESSAGES.bookmarkButton;

const setup = customRenderServerAsync(
  BookmarkButtonGate,
  { postId: MOCK_POST_ID },
  { wrapper: ToastProvider },
);

describe(`<${BookmarkButtonGate.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: faker.string.uuid() }, expires: '' },
      status: SESSION_STATUS.AUTHENTICATED,
      update: vi.fn(),
    });
    vi.mocked(getBookmarkStatus).mockResolvedValue(false);
  });

  it('renders the bookmark toggle for the post when bookmarks are enabled', async () => {
    await setup();

    const toggle = await screen.findByRole('button', { name: saveAriaLabel });
    await waitFor(() => expect(toggle).toBeEnabled());

    expect(toggle).toBeVisible();
    expect(getBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_ID);
  });

  it.each<[string, () => void]>([
    [
      'bookmarks are not enabled',
      () => vi.mocked(isCapabilityEnabled).mockResolvedValue(false),
    ],
    [
      'the site is suspended',
      () =>
        vi
          .mocked(resolveRequestTenant)
          .mockResolvedValueOnce(MOCK_SUSPENDED_TENANT),
    ],
  ])('renders no toggle when %s', async (_, arrange) => {
    arrange();

    await setup();

    const toggle = screen.queryByRole('button', { name: saveAriaLabel });

    expect(toggle).not.toBeInTheDocument();
  });

  it('checks the bookmarks capability', async () => {
    await setup();

    expect(isCapabilityEnabled).toHaveBeenCalledWith(CAPABILITY.BOOKMARKS);
  });
});
