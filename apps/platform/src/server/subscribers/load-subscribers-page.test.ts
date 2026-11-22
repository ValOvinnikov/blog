import { faker } from '@faker-js/faker';
import {
  SUBSCRIBERS_NOTICE,
  SUBSCRIBERS_PAGE_SIZE,
} from '@platform/constants/subscribers';
import { readNewsletterStop } from '@platform/server/newsletter-pause/read-newsletter-stop';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_SUBSCRIBERS_LIMITS,
  MOCK_SUBSCRIBERS_NEXT_BAND,
  mockConfirmedSubscriber,
} from '@platform/testing/subscribers/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  NEWSLETTER_SKIP_REASON,
  NEXT_NAVIGATION_ERROR,
  TENANT_PLAN,
} from '@shinefold/config';
import { redirect } from 'next/navigation';

import { loadSubscribersPage } from './load-subscribers-page';

faker.seed(7164);

const {
  listSubscribersPageMock,
  getNewsletterLimitsMock,
  getEmailNewPostsMock,
  getLatestSkippedNewsletterPostMock,
  listStripePricesMock,
} = vi.hoisted(() => ({
  listSubscribersPageMock: vi.fn(),
  getNewsletterLimitsMock: vi.fn(),
  getEmailNewPostsMock: vi.fn(),
  getLatestSkippedNewsletterPostMock: vi.fn(),
  listStripePricesMock: vi.fn(),
}));

vi.mock('@platform/server/newsletter-pause/read-newsletter-stop', () => ({
  readNewsletterStop: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    subscribers: { listSubscribersPage: listSubscribersPageMock },
    emailUsage: { getNewsletterLimits: getNewsletterLimitsMock },
    emailConfig: { getEmailNewPosts: getEmailNewPostsMock },
    newsletterPostSends: {
      getLatestSkippedNewsletterPost: getLatestSkippedNewsletterPostMock,
    },
    stripeCatalogue: { listStripePrices: listStripePricesMock },
  },
}));

const tenant = mockReadyTenant({
  id: MOCK_TENANT_ID,
  plan: TENANT_PLAN.GROWTH,
});
const MOCK_ROWS = [mockConfirmedSubscriber()];
const OVER_BAND_COUNT = MOCK_SUBSCRIBERS_LIMITS.bandCeiling + 1;

describe(loadSubscribersPage, () => {
  beforeEach(() => {
    listSubscribersPageMock.mockResolvedValue({
      rows: MOCK_ROWS,
      total: MOCK_ROWS.length,
    });
    getNewsletterLimitsMock.mockResolvedValue(MOCK_SUBSCRIBERS_LIMITS);
    getEmailNewPostsMock.mockResolvedValue(true);
    vi.mocked(readNewsletterStop).mockResolvedValue({
      isStopped: false,
      pausedAt: undefined,
    });
    listStripePricesMock.mockResolvedValue([]);
  });

  it('reads the asked page of confirmed subscribers, 25 at a time', async () => {
    const data = await loadSubscribersPage(tenant, 1, undefined);

    expect(listSubscribersPageMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      { page: 1, pageSize: SUBSCRIBERS_PAGE_SIZE },
    );
    expect(data).toEqual(
      expect.objectContaining({
        list: { rows: MOCK_ROWS, total: MOCK_ROWS.length },
        totalPages: 1,
        emailNewPosts: true,
        nextBand: MOCK_SUBSCRIBERS_NEXT_BAND,
        notice: undefined,
      }),
    );
    expect(getLatestSkippedNewsletterPostMock).not.toHaveBeenCalled();
    expect(listStripePricesMock).not.toHaveBeenCalled();
  });

  it('sends a page past the end back to the last page', async () => {
    await expect(loadSubscribersPage(tenant, 4, undefined)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboardSubscribers(1));
  });

  it('reads the post the band pause skipped and the move-up prices', async () => {
    getNewsletterLimitsMock.mockResolvedValue({
      ...MOCK_SUBSCRIBERS_LIMITS,
      activeCount: OVER_BAND_COUNT,
    });

    const data = await loadSubscribersPage(tenant, 1, undefined);

    expect(data.notice).toBe(SUBSCRIBERS_NOTICE.BAND_PAUSED);
    expect(getLatestSkippedNewsletterPostMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    );
    expect(listStripePricesMock).toHaveBeenCalledTimes(1);
  });

  it('confirms a move up only to the band the site is now on', async () => {
    const { bandCeiling } = MOCK_SUBSCRIBERS_LIMITS;

    const [current, stale] = await Promise.all([
      loadSubscribersPage(tenant, 1, bandCeiling),
      loadSubscribersPage(tenant, 1, bandCeiling - 1),
    ]);

    expect(current.notice).toBe(SUBSCRIBERS_NOTICE.MOVED_UP);
    expect(stale.notice).toBeUndefined();
  });

  it('shows the operator pause with its date', async () => {
    const pausedAt = faker.date.recent();
    vi.mocked(readNewsletterStop).mockResolvedValue({
      isStopped: true,
      pausedAt,
    });

    const data = await loadSubscribersPage(tenant, 1, undefined);

    expect(data.notice).toBe(SUBSCRIBERS_NOTICE.OPERATOR_PAUSE);
    expect(data.pausedAt).toBe(pausedAt);
  });
});
