import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { LEAD_LOG, LEAD_REFUSAL } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_LEAD_ID } from '@platform/testing/leads/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { deleteLeadAction } from './delete-lead-action';

faker.seed(5757);

const { deleteLeadMock } = vi.hoisted(() => ({ deleteLeadMock: vi.fn() }));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@blog/db', () => ({
  queries: { leads: { deleteLead: deleteLeadMock } },
}));

const MOCK_NOT_A_UUID = faker.lorem.word();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_NOT_FOUND = new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

describe(deleteLeadAction, () => {
  beforeEach(() => {
    deleteLeadMock.mockReset();
    deleteLeadMock.mockResolvedValue(true);
  });

  it("deletes the lead inside the session's tenant after re-checking membership", async () => {
    const result = await deleteLeadAction(MOCK_TENANT_ID, MOCK_LEAD_ID);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(deleteLeadMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      id: MOCK_LEAD_ID,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('deletes nothing for an editor', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    await expect(
      deleteLeadAction(MOCK_TENANT_ID, MOCK_LEAD_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it.each([
    ['lead id', MOCK_TENANT_ID, MOCK_NOT_A_UUID],
    ['tenant id', MOCK_NOT_A_UUID, MOCK_LEAD_ID],
  ])(
    'rejects a %s that is not a uuid without touching the gate',
    async (_label, tenantId, leadId) => {
      const result = await deleteLeadAction(tenantId, leadId);

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {},
      });
      expect(requireTenantMembership).not.toHaveBeenCalled();
      expect(deleteLeadMock).not.toHaveBeenCalled();
    },
  );

  it('deletes nothing when the caller is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(MOCK_NOT_FOUND);

    await expect(
      deleteLeadAction(MOCK_TENANT_ID, MOCK_LEAD_ID),
    ).rejects.toThrow(MOCK_NOT_FOUND);

    expect(deleteLeadMock).not.toHaveBeenCalled();
  });

  it('reports a lead that is not in that tenant as not found', async () => {
    deleteLeadMock.mockResolvedValue(false);

    const result = await deleteLeadAction(MOCK_TENANT_ID, MOCK_LEAD_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });
  });

  it('reports failure and logs when the delete throws', async () => {
    deleteLeadMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await deleteLeadAction(MOCK_TENANT_ID, MOCK_LEAD_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(LEAD_LOG.DELETE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_DB_ERROR.name,
    });
  });
});
