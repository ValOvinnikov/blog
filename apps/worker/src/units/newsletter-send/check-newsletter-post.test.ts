import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { getEmailNewPosts } from '@blog/db/queries/email-config';
import {
  getSettingsFeatures,
  type TSettingsFeaturesResult,
} from '@blog/db/queries/settings-features';
import {
  getTenantById,
  getTenantSanityCredentials,
  type TTenantSanityCredentials,
} from '@blog/db/queries/tenants';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SCHEDULE_RECHECK_MS,
} from '@worker/constants/newsletter-send';
import {
  MOCK_NEWSLETTER_POST,
  MOCK_POST_ID,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { readNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';

import { checkNewsletterPost } from './check-newsletter-post';

vi.mock('@blog/db/queries/email-config');
vi.mock('@blog/db/queries/settings-features');
vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/newsletter-send/read-newsletter-post');

const MOCK_NOW = new Date('2031-05-15T12:00:00Z');
const MOCK_CREDENTIALS = {} as TTenantSanityCredentials;
const CANCELLED = { state: NEWSLETTER_POST_STATE.CANCELLED };
const ONE_HOUR_MS = 60 * 60_000;

function runCheck() {
  return checkNewsletterPost(MOCK_TENANT_ID, MOCK_POST_ID);
}

describe(checkNewsletterPost, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW, toFake: ['Date'] });
    vi.mocked(getTenantById).mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
    vi.mocked(getSettingsFeatures).mockResolvedValue({
      newsletterEnabled: true,
    } as TSettingsFeaturesResult);
    vi.mocked(getEmailNewPosts).mockResolvedValue(true);
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(MOCK_CREDENTIALS);
    vi.mocked(readNewsletterPost).mockResolvedValue(MOCK_NEWSLETTER_POST);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is ready once a published post with its switch on is due', async () => {
    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.READY,
      post: MOCK_NEWSLETTER_POST,
    });
    expect(readNewsletterPost).toHaveBeenCalledWith(
      MOCK_CREDENTIALS,
      MOCK_POST_ID,
    );
  });

  it('waits until a post dated in the future is due', async () => {
    vi.mocked(readNewsletterPost).mockResolvedValue({
      ...MOCK_NEWSLETTER_POST,
      publishedAt: new Date(MOCK_NOW.getTime() + ONE_HOUR_MS).toISOString(),
    });

    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.SCHEDULED,
      waitMs: ONE_HOUR_MS,
    });
  });

  it('checks a far-future post again within a day', async () => {
    vi.mocked(readNewsletterPost).mockResolvedValue({
      ...MOCK_NEWSLETTER_POST,
      publishedAt: new Date(
        MOCK_NOW.getTime() + 3 * NEWSLETTER_SCHEDULE_RECHECK_MS,
      ).toISOString(),
    });

    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.SCHEDULED,
      waitMs: NEWSLETTER_SCHEDULE_RECHECK_MS,
    });
  });

  it.each([
    ['unpublished', undefined],
    ['switched off', { ...MOCK_NEWSLETTER_POST, isSendToSubscribersOn: false }],
  ])('cancels a post that is %s', async (_, post) => {
    vi.mocked(readNewsletterPost).mockResolvedValue(post);

    await expect(runCheck()).resolves.toEqual(CANCELLED);
  });

  it.each([
    [
      'a plan without the newsletter',
      () =>
        vi
          .mocked(getTenantById)
          .mockResolvedValue(mockTenant({ plan: TENANT_PLAN.FREE })),
    ],
    [
      'a suspended site',
      () =>
        vi.mocked(getTenantById).mockResolvedValue(
          mockTenant({
            plan: TENANT_PLAN.GROWTH,
            status: TENANT_STATUS.SUSPENDED,
          }),
        ),
    ],
    [
      'the Newsletter switch off',
      () => vi.mocked(getSettingsFeatures).mockResolvedValue(undefined),
    ],
    [
      '"email new posts" off',
      () => vi.mocked(getEmailNewPosts).mockResolvedValue(false),
    ],
    [
      'an unknown site',
      () => vi.mocked(getTenantById).mockResolvedValue(undefined),
    ],
  ])('cancels the send for %s without reading the post', async (_, arrange) => {
    arrange();

    await expect(runCheck()).resolves.toEqual(CANCELLED);
    expect(readNewsletterPost).not.toHaveBeenCalled();
  });
});
