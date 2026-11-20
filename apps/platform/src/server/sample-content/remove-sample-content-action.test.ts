import {
  SAMPLE_CONTENT_LOG,
  SAMPLE_CONTENT_PATH,
  SAMPLE_CONTENT_REFUSAL,
  SAMPLE_KIND,
} from '@platform/constants/sample-content';
import { WORKER_LOG } from '@platform/constants/worker';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import {
  stubWorkerFetch,
  type TWorkerFetchMock,
} from '@platform/testing/worker/stub-worker-fetch';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, HTTP_STATUS } from '@shinefold/config';
import { TENANT_STATUS } from '@shinefold/db/constants';

import { removeSampleContentAction } from './remove-sample-content-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/utils/env/env');

const fetchMock: TWorkerFetchMock = vi.fn();
const loggerErrorMock = vi.mocked(logger.error);

const EDITED_ID = 'starter.business.services';
const REFERENCED_ID = 'starter.blog.welcomePost';
const LINK_ID = 'starter.blog.aboutLink';
const SECTION_ID = 'starter.docs.guidesList';
const UNKNOWN_ID = 'starter.blog.somethingNew';
const REMOVED_IDS = ['starter.blog.hero', 'starter.blog.cta'];
const EDITED_TITLE = 'Our services';

const WORKER_RESULT = {
  removed: REMOVED_IDS,
  keptEdited: [{ id: EDITED_ID, type: 'page_landing', title: EDITED_TITLE }],
  keptReferenced: [
    { id: REFERENCED_ID, type: 'page_post' },
    { id: LINK_ID, type: 'link' },
    { id: SECTION_ID, type: 'module_sectionPages' },
  ],
};

const answer = (body: unknown, status: number = HTTP_STATUS.OK) =>
  fetchMock.mockResolvedValue(Response.json(body, { status }));

describe(removeSampleContentAction, () => {
  beforeEach(() => {
    stubWorkerFetch(fetchMock);
    answer(WORKER_RESULT);
  });

  it('runs the removal and reports what was removed and kept, by kind', async () => {
    const result = await removeSampleContentAction(MOCK_TENANT_ID);
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.pathname).toBe(SAMPLE_CONTENT_PATH.REMOVE);
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      removedCount: REMOVED_IDS.length,
      keptEdited: [
        { id: EDITED_ID, kind: SAMPLE_KIND.PAGE, title: EDITED_TITLE },
      ],
      keptReferenced: [
        { id: REFERENCED_ID, kind: SAMPLE_KIND.PAGE },
        { id: LINK_ID, kind: SAMPLE_KIND.LINK },
        { id: SECTION_ID, kind: SAMPLE_KIND.SECTION },
      ],
    });
  });

  it('names a document type it does not know as a plain sample', async () => {
    answer({
      ...WORKER_RESULT,
      keptEdited: [{ id: UNKNOWN_ID, type: 'settings_unknown' }],
    });

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toMatchObject({
      keptEdited: [{ id: UNKNOWN_ID, kind: SAMPLE_KIND.OTHER }],
    });
  });

  it('refuses a suspended site without calling the worker', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockMembershipContext(
        mockReadyTenant({ status: TENANT_STATUS.SUSPENDED }),
      ),
    );

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SAMPLE_CONTENT_REFUSAL.NOT_WRITABLE,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs the status and answers a server error when the worker fails', async () => {
    answer({}, HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  });

  it('logs and answers a server error for a response it cannot read', async () => {
    answer({ removed: REMOVED_IDS });

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CONTENT_LOG.REMOVAL_RESPONSE_INVALID,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('logs and answers a server error when the worker cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      WORKER_LOG.ENQUEUE_ERROR,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
