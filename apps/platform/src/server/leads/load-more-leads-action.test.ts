import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LEAD_LOG } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockLead } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { loadMoreLeadsAction } from './load-more-leads-action';

faker.seed(5759);

const { listLeadsByCursorMock } = vi.hoisted(() => ({
  listLeadsByCursorMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeadsByCursor: listLeadsByCursorMock } },
}));

const MOCK_CURSOR = {
  createdAt: '2026-04-02 09:30:00.123456+00',
  id: faker.string.uuid(),
};
const MOCK_READ_LEAD = mockLead({ readAt: faker.date.past() });
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_NOT_FOUND = new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

describe(loadMoreLeadsAction, () => {
  beforeEach(() => {
    listLeadsByCursorMock.mockReset();
    listLeadsByCursorMock.mockResolvedValue({
      leads: [MOCK_READ_LEAD],
      nextCursor: undefined,
    });
  });

  it("returns the tenant's next leads after the cursor, as the list shows them", async () => {
    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, MOCK_CURSOR);

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      after: MOCK_CURSOR,
    });
    expect(result).toEqual({
      isLoaded: true,
      page: {
        leads: [
          {
            id: MOCK_READ_LEAD.id,
            name: MOCK_READ_LEAD.name,
            email: MOCK_READ_LEAD.email,
            message: MOCK_READ_LEAD.message,
            sourcePath: MOCK_READ_LEAD.sourcePath,
            sourceDocumentId: MOCK_READ_LEAD.sourceDocumentId,
            sourceLocale: null,
            isRead: true,
            createdAt: MOCK_READ_LEAD.createdAt,
          },
        ],
        nextCursor: undefined,
      },
    });
  });

  it('reads nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(MOCK_NOT_FOUND);

    await expect(
      loadMoreLeadsAction(MOCK_TENANT_ID, MOCK_CURSOR),
    ).rejects.toThrow(MOCK_NOT_FOUND);

    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it('rejects a malformed cursor without touching the gate', async () => {
    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, {
      ...MOCK_CURSOR,
      id: faker.lorem.word(),
    });

    expect(result).toEqual({ isLoaded: false });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('reports failure and logs when the read throws', async () => {
    listLeadsByCursorMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, MOCK_CURSOR);

    expect(result).toEqual({ isLoaded: false });
    expect(logger.error).toHaveBeenCalledWith(LEAD_LOG.LOAD_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_DB_ERROR,
    });
  });
});
