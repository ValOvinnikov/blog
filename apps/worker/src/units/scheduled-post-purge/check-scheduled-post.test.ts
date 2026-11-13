import { DAY_MS } from '@blog/db/constants';
import {
  getTenantSanityCredentials,
  type TTenantSanityCredentials,
} from '@blog/db/queries/tenants';
import { SCHEDULED_POST_STATE } from '@worker/constants/scheduled-post-purge';
import {
  MOCK_LATER_PUBLISHED_AT,
  MOCK_PUBLISHED_AT,
  MOCK_SCHEDULED_POST_ID,
} from '@worker/testing/scheduled-post-purge/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { readPostPublishedAt } from '@worker/utils/scheduled-post-purge/read-post-published-at';

import { checkScheduledPost } from './check-scheduled-post';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/scheduled-post-purge/read-post-published-at');

const MOCK_CREDENTIALS = {} as TTenantSanityCredentials;
const MOCK_ONE_HOUR_MS = 60 * 60_000;
const MOCK_PUBLISH_MS = Date.parse(MOCK_PUBLISHED_AT);
const STALE = { state: SCHEDULED_POST_STATE.STALE };

function runCheck() {
  return checkScheduledPost(
    MOCK_TENANT_ID,
    MOCK_SCHEDULED_POST_ID,
    MOCK_PUBLISHED_AT,
  );
}

function atTime(ms: number) {
  vi.useFakeTimers({ now: ms, toFake: ['Date'] });
}

describe(checkScheduledPost, () => {
  beforeEach(() => {
    atTime(MOCK_PUBLISH_MS - MOCK_ONE_HOUR_MS);
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(MOCK_CREDENTIALS);
    vi.mocked(readPostPublishedAt).mockResolvedValue(MOCK_PUBLISHED_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits until the publish time', async () => {
    await expect(runCheck()).resolves.toEqual({
      state: SCHEDULED_POST_STATE.SCHEDULED,
      waitMs: MOCK_ONE_HOUR_MS,
    });
    expect(readPostPublishedAt).toHaveBeenCalledWith(
      MOCK_CREDENTIALS,
      MOCK_SCHEDULED_POST_ID,
    );
  });

  it('wakes at least daily to re-read a post dated further out', async () => {
    atTime(MOCK_PUBLISH_MS - 3 * DAY_MS);

    await expect(runCheck()).resolves.toEqual({
      state: SCHEDULED_POST_STATE.SCHEDULED,
      waitMs: DAY_MS,
    });
  });

  it('is due once the publish time has passed', async () => {
    atTime(MOCK_PUBLISH_MS);

    await expect(runCheck()).resolves.toEqual({
      state: SCHEDULED_POST_STATE.DUE,
    });
  });

  it('is stale when the post was rescheduled', async () => {
    vi.mocked(readPostPublishedAt).mockResolvedValue(MOCK_LATER_PUBLISHED_AT);

    await expect(runCheck()).resolves.toEqual(STALE);
  });

  it('is stale when the post was unpublished or deleted', async () => {
    vi.mocked(readPostPublishedAt).mockResolvedValue(undefined);

    await expect(runCheck()).resolves.toEqual(STALE);
  });

  it('is stale when the tenant can no longer be read', async () => {
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(undefined);

    await expect(runCheck()).resolves.toEqual(STALE);
    expect(readPostPublishedAt).not.toHaveBeenCalled();
  });
});
