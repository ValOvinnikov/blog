import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { LEAD_LOG, LEAD_REFUSAL } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { setLeadReadAction } from './set-lead-read-action';

const { markLeadReadMock, markLeadUnreadMock } = vi.hoisted(() => ({
  markLeadReadMock: vi.fn(),
  markLeadUnreadMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@blog/db', () => ({
  queries: {
    leads: {
      markLeadRead: markLeadReadMock,
      markLeadUnread: markLeadUnreadMock,
    },
  },
}));

const LEAD_ID = '0b7d5c1e-8a47-4c3e-b1f6-2f4d9e6a7b31';
const LEAD_KEY = { tenantId: MOCK_TENANT_ID, id: LEAD_ID };

describe(setLeadReadAction, () => {
  beforeEach(() => {
    markLeadReadMock.mockReset();
    markLeadReadMock.mockResolvedValue(true);
    markLeadUnreadMock.mockReset();
    markLeadUnreadMock.mockResolvedValue(true);
  });

  it("marks the lead read inside the session's tenant", async () => {
    const result = await setLeadReadAction(MOCK_TENANT_ID, LEAD_ID, true);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(markLeadReadMock).toHaveBeenCalledWith(LEAD_KEY);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('marks the lead unread again', async () => {
    await setLeadReadAction(MOCK_TENANT_ID, LEAD_ID, false);

    expect(markLeadUnreadMock).toHaveBeenCalledWith(LEAD_KEY);
    expect(markLeadReadMock).not.toHaveBeenCalled();
  });

  it('changes nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      setLeadReadAction(MOCK_TENANT_ID, LEAD_ID, true),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(markLeadReadMock).not.toHaveBeenCalled();
  });

  it('rejects an id that is not a uuid without touching the gate', async () => {
    const result = await setLeadReadAction(MOCK_TENANT_ID, 'not-a-uuid', true);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('reports a lead that is not in that tenant as not found', async () => {
    markLeadReadMock.mockResolvedValue(false);

    const result = await setLeadReadAction(MOCK_TENANT_ID, LEAD_ID, true);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });
  });

  it('reports failure and logs when the update throws', async () => {
    markLeadReadMock.mockRejectedValue(new Error('db unavailable'));

    const result = await setLeadReadAction(MOCK_TENANT_ID, LEAD_ID, true);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      LEAD_LOG.READ_STATE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
