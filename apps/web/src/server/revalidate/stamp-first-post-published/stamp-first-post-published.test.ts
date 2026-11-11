import { faker } from '@faker-js/faker';
import {
  REVALIDATE_LOG,
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { stampFirstPostPublished } from './stamp-first-post-published';

const { stampTenantFirstPostPublishedMock } = vi.hoisted(() => ({
  stampTenantFirstPostPublishedMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      stampTenantFirstPostPublished: stampTenantFirstPostPublishedMock,
    },
  },
}));

faker.seed(7154);

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_STARTER_POST_ID = `${STARTER_DOCUMENT_ID_PREFIX}${faker.lorem.word()}`;
const MOCK_OTHER_TYPE = faker.string.alphanumeric(12);

describe(stampFirstPostPublished, () => {
  it.each([
    SANITY_WEBHOOK_OPERATION.CREATE,
    SANITY_WEBHOOK_OPERATION.UPDATE,
    null,
  ])(
    'stamps the tenant for a published post on a %s event',
    async (operation) => {
      await stampFirstPostPublished({
        operation,
        type: POST_TYPE,
        id: MOCK_POST_ID,
        tenantId: MOCK_TENANT_ID,
      });

      expect(stampTenantFirstPostPublishedMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
    },
  );

  it.each([
    {
      case: 'a deleted post',
      operation: SANITY_WEBHOOK_OPERATION.DELETE,
      type: POST_TYPE,
      id: MOCK_POST_ID,
      tenantId: MOCK_TENANT_ID,
    },
    {
      case: 'a starter post',
      operation: SANITY_WEBHOOK_OPERATION.CREATE,
      type: POST_TYPE,
      id: MOCK_STARTER_POST_ID,
      tenantId: MOCK_TENANT_ID,
    },
    {
      case: 'a document that is not a post',
      operation: SANITY_WEBHOOK_OPERATION.CREATE,
      type: MOCK_OTHER_TYPE,
      id: MOCK_POST_ID,
      tenantId: MOCK_TENANT_ID,
    },
    {
      case: 'a post with no resolved tenant',
      operation: SANITY_WEBHOOK_OPERATION.CREATE,
      type: POST_TYPE,
      id: MOCK_POST_ID,
      tenantId: undefined,
    },
  ])('stamps nothing for $case', async ({ operation, type, id, tenantId }) => {
    await stampFirstPostPublished({ operation, type, id, tenantId });

    expect(stampTenantFirstPostPublishedMock).not.toHaveBeenCalled();
  });

  it('logs and resolves when the stamp throws', async () => {
    stampTenantFirstPostPublishedMock.mockRejectedValueOnce(MOCK_ERROR);

    await expect(
      stampFirstPostPublished({
        operation: SANITY_WEBHOOK_OPERATION.CREATE,
        type: POST_TYPE,
        id: MOCK_POST_ID,
        tenantId: MOCK_TENANT_ID,
      }),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.FIRST_POST_STAMP_FAILED,
      { tenantId: MOCK_TENANT_ID, id: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });
});
