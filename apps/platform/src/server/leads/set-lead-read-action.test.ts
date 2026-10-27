import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LEAD_LOG, LEAD_REFUSAL } from '@platform/constants/lead';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_LEAD_ID } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { setLeadReadAction } from './set-lead-read-action';

faker.seed(5758);

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

const MOCK_LEAD_KEY = { tenantId: MOCK_TENANT_ID, id: MOCK_LEAD_ID };
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_NOT_FOUND = new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

describe(setLeadReadAction, () => {
  beforeEach(() => {
    markLeadReadMock.mockReset();
    markLeadReadMock.mockResolvedValue(true);
    markLeadUnreadMock.mockReset();
    markLeadUnreadMock.mockResolvedValue(true);
  });

  it.each([
    ['read', true, markLeadReadMock, markLeadUnreadMock],
    ['unread', false, markLeadUnreadMock, markLeadReadMock],
  ])(
    "marks the lead %s inside the session's tenant",
    async (_label, isRead, applied, untouched) => {
      const result = await setLeadReadAction(
        MOCK_TENANT_ID,
        MOCK_LEAD_ID,
        isRead,
      );

      expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(applied).toHaveBeenCalledWith(MOCK_LEAD_KEY);
      expect(untouched).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    },
  );

  it('changes nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(MOCK_NOT_FOUND);

    await expect(
      setLeadReadAction(MOCK_TENANT_ID, MOCK_LEAD_ID, true),
    ).rejects.toThrow(MOCK_NOT_FOUND);

    expect(markLeadReadMock).not.toHaveBeenCalled();
  });

  it('rejects an id that is not a uuid without touching the gate', async () => {
    const result = await setLeadReadAction(
      MOCK_TENANT_ID,
      faker.lorem.word(),
      true,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('reports a lead that is not in that tenant as not found', async () => {
    markLeadReadMock.mockResolvedValue(false);

    const result = await setLeadReadAction(MOCK_TENANT_ID, MOCK_LEAD_ID, true);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });
  });

  it('reports failure and logs when the update throws', async () => {
    markLeadReadMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await setLeadReadAction(MOCK_TENANT_ID, MOCK_LEAD_ID, true);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(LEAD_LOG.READ_STATE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_DB_ERROR.name,
    });
  });
});
