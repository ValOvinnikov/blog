import {
  SAMPLE_CONTENT_LOG,
  SAMPLE_CONTENT_PATH,
  SAMPLE_CONTENT_REFUSAL,
  SAMPLE_KIND,
} from '@platform/constants/sample-content';
import { WORKER_LOG } from '@platform/constants/worker';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import { MOCK_KEPT_SAMPLE_TITLE } from '@platform/testing/sample-content/fixtures';
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

const MOCK_EDITED_ID = 'starter.business.services';
const MOCK_POST_ID = 'starter.blog.welcomePost';
const MOCK_LINK_ID = 'starter.blog.aboutLink';
const MOCK_SECTION_ID = 'starter.docs.guidesList';
const MOCK_UNKNOWN_ID = 'starter.blog.somethingNew';
const MOCK_REMOVED_IDS = ['starter.blog.hero', 'starter.blog.cta'];
const MOCK_GATEWAY_PAGE = '<html>Bad gateway</html>';

const MOCK_WORKER_RESULT = {
  removed: MOCK_REMOVED_IDS,
  keptEdited: [
    { id: MOCK_EDITED_ID, type: 'page_landing', title: MOCK_KEPT_SAMPLE_TITLE },
  ],
  keptReferenced: [
    { id: MOCK_POST_ID, type: 'page_post' },
    { id: MOCK_LINK_ID, type: 'link' },
    { id: MOCK_SECTION_ID, type: 'module_sectionPages' },
  ],
};

const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const NOT_WRITABLE = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SAMPLE_CONTENT_REFUSAL.NOT_WRITABLE,
};

const answer = (body: unknown, status: number = HTTP_STATUS.OK) =>
  fetchMock.mockResolvedValue(Response.json(body, { status }));

describe(removeSampleContentAction, () => {
  beforeEach(() => {
    stubWorkerFetch(fetchMock);
    answer(MOCK_WORKER_RESULT);
  });

  it('runs the removal and reports what was removed and kept, by kind', async () => {
    const result = await removeSampleContentAction(MOCK_TENANT_ID);
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.pathname).toBe(SAMPLE_CONTENT_PATH.REMOVE);
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      removedCount: MOCK_REMOVED_IDS.length,
      keptEdited: [
        {
          id: MOCK_EDITED_ID,
          kind: SAMPLE_KIND.PAGE,
          title: MOCK_KEPT_SAMPLE_TITLE,
        },
      ],
      keptReferenced: [
        { id: MOCK_POST_ID, kind: SAMPLE_KIND.POST },
        { id: MOCK_LINK_ID, kind: SAMPLE_KIND.LINK },
        { id: MOCK_SECTION_ID, kind: SAMPLE_KIND.SECTION },
      ],
    });
  });

  it('names a document type it does not know as a plain sample', async () => {
    answer({
      ...MOCK_WORKER_RESULT,
      keptEdited: [{ id: MOCK_UNKNOWN_ID, type: 'settings_unknown' }],
    });

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toMatchObject({
      keptEdited: [{ id: MOCK_UNKNOWN_ID, kind: SAMPLE_KIND.OTHER }],
    });
  });

  it('refuses a suspended site without calling the worker', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockMembershipContext(
        mockReadyTenant({ status: TENANT_STATUS.SUSPENDED }),
      ),
    );

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual(NOT_WRITABLE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses without logging when the worker finds the site not writable', async () => {
    answer(
      { error: SAMPLE_CONTENT_REFUSAL.NOT_WRITABLE },
      HTTP_STATUS.CONFLICT,
    );

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual(NOT_WRITABLE);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      case: 'a failed removal',
      response: () =>
        Response.json({}, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
      responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    },
    {
      case: 'another conflict',
      response: () => Response.json({}, { status: HTTP_STATUS.CONFLICT }),
      responseStatus: HTTP_STATUS.CONFLICT,
    },
    {
      case: 'a gateway page',
      response: () =>
        new Response(MOCK_GATEWAY_PAGE, { status: HTTP_STATUS.BAD_GATEWAY }),
      responseStatus: HTTP_STATUS.BAD_GATEWAY,
    },
  ])(
    'logs the status and answers a server error for $case',
    async ({ response, responseStatus }) => {
      fetchMock.mockResolvedValue(response());

      const result = await removeSampleContentAction(MOCK_TENANT_ID);

      expect(result).toEqual(SERVER_ERROR);
      expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
        SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
        { tenantId: MOCK_TENANT_ID, responseStatus },
      );
    },
  );

  it('logs and answers a server error for a response it cannot read', async () => {
    answer({ removed: MOCK_REMOVED_IDS });

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual(SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CONTENT_LOG.REMOVAL_RESPONSE_INVALID,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('logs and answers a server error when the worker cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await removeSampleContentAction(MOCK_TENANT_ID);

    expect(result).toEqual(SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      WORKER_LOG.ENQUEUE_ERROR,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
