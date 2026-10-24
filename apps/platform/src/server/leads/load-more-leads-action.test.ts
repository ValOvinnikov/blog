import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { LEAD_LOG } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockLead } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { loadMoreLeadsAction } from './load-more-leads-action';

const { listLeadsByCursorMock } = vi.hoisted(() => ({
  listLeadsByCursorMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeadsByCursor: listLeadsByCursorMock } },
}));

const CURSOR = {
  createdAt: '2026-04-02 09:30:00.123456+00',
  id: '0b7d5c1e-8a47-4c3e-b1f6-2f4d9e6a7b31',
};

describe(loadMoreLeadsAction, () => {
  beforeEach(() => {
    listLeadsByCursorMock.mockReset();
    listLeadsByCursorMock.mockResolvedValue({
      leads: [mockLead({ readAt: new Date() })],
      nextCursor: undefined,
    });
  });

  it("returns the tenant's next leads after the cursor, with only what the list shows", async () => {
    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, CURSOR);

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      after: CURSOR,
    });
    expect(result).toEqual({
      isLoaded: true,
      page: {
        leads: [expect.objectContaining({ isRead: true })],
        nextCursor: undefined,
      },
    });
    expect(result.isLoaded && result.page.leads[0]).not.toHaveProperty(
      'readAt',
    );
  });

  it('reads nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(loadMoreLeadsAction(MOCK_TENANT_ID, CURSOR)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it('rejects a malformed cursor without touching the gate', async () => {
    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, {
      ...CURSOR,
      id: 'not-a-uuid',
    });

    expect(result).toEqual({ isLoaded: false });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('reports failure and logs when the read throws', async () => {
    listLeadsByCursorMock.mockRejectedValue(new Error('db unavailable'));

    const result = await loadMoreLeadsAction(MOCK_TENANT_ID, CURSOR);

    expect(result).toEqual({ isLoaded: false });
    expect(logger.error).toHaveBeenCalledWith(
      LEAD_LOG.LOAD_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
