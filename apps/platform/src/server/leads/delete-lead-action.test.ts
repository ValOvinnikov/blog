import { ACTION_OUTCOME } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { LEAD_REFUSAL } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { deleteLeadAction } from './delete-lead-action';

const { deleteLeadMock } = vi.hoisted(() => ({ deleteLeadMock: vi.fn() }));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/utils/logger/logger');

vi.mock('@blog/db', () => ({
  queries: { leads: { deleteLead: deleteLeadMock } },
}));

const TENANT_ID = '6f1c7a52-3b0e-4f0a-9a43-1d6b2b7a9c10';
const LEAD_ID = '0b7d5c1e-8a47-4c3e-b1f6-2f4d9e6a7b31';

describe(deleteLeadAction, () => {
  beforeEach(() => {
    deleteLeadMock.mockReset();
    deleteLeadMock.mockResolvedValue(true);
  });

  it("deletes the lead inside the session's tenant after re-checking membership", async () => {
    const result = await deleteLeadAction(TENANT_ID, LEAD_ID);

    expect(requireTenantMembership).toHaveBeenCalledWith(TENANT_ID);
    expect(deleteLeadMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      id: LEAD_ID,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('deletes nothing for an editor', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(
      async (tenantId) => ({
        tenant: makeReadyTenant({ id: tenantId }),
        membership: {
          id: 'membership-2',
          userId: 'user-2',
          tenantId,
          role: MEMBERSHIP_ROLE.EDITOR,
          createdAt: new Date('2026-04-02T00:00:00.000Z'),
        },
      }),
    );

    await expect(deleteLeadAction(TENANT_ID, LEAD_ID)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it('rejects an id that is not a uuid without touching the gate or the database', async () => {
    const result = await deleteLeadAction(TENANT_ID, 'not-a-uuid');

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it('rejects a tenant id that is not a uuid', async () => {
    const result = await deleteLeadAction('tenant-1', LEAD_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it('deletes nothing when the caller is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error('NEXT_NOT_FOUND'),
    );

    await expect(deleteLeadAction(TENANT_ID, LEAD_ID)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it('reports a lead that is not in that tenant as not found', async () => {
    deleteLeadMock.mockResolvedValue(false);

    const result = await deleteLeadAction(TENANT_ID, LEAD_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });
  });

  it('reports failure and logs when the delete throws', async () => {
    deleteLeadMock.mockRejectedValue(new Error('db unavailable'));

    const result = await deleteLeadAction(TENANT_ID, LEAD_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      'leads.delete_failed',
      expect.objectContaining({
        tenantId: TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });
});
