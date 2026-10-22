import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { SIGNUP_BLOCK_FIELD_ERROR } from '@platform/constants/signup-block';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import {
  BLOCK_REASON,
  BLOCKED_DOMAIN,
  makeBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { addBlockedDomainAction } from './add-blocked-domain-action';

const { requireSuperAdminMock, addSignupBlockMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  addSignupBlockMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/signup-block/add-signup-block', () => ({
  addSignupBlock: addSignupBlockMock,
}));

const ADMIN = makeAdmin();
const INPUT = { domain: ` ${BLOCKED_DOMAIN} `, reason: ` ${BLOCK_REASON} ` };

describe(addBlockedDomainAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(ADMIN);
    addSignupBlockMock.mockReset().mockResolvedValue({
      ok: true,
      data: { entry: makeBlockedIdentity(), created: true },
    });
    vi.mocked(logger.error).mockReset();
  });

  it('rejects a caller who is not a super admin before touching the list', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(addBlockedDomainAction(INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(addSignupBlockMock).not.toHaveBeenCalled();
  });

  it('adds the trimmed domain with the trimmed reason as the admin', async () => {
    const result = await addBlockedDomainAction(INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(addSignupBlockMock).toHaveBeenCalledWith({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: BLOCKED_DOMAIN,
      reason: BLOCK_REASON,
      admin: ADMIN,
    });
  });

  it('names both fields when the domain and reason are blank', async () => {
    const result = await addBlockedDomainAction({ domain: ' ', reason: '' });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
        reason: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_REASON_REQUIRED },
      },
    });
    expect(addSignupBlockMock).not.toHaveBeenCalled();
  });

  it('reports a domain the list rejects as a field error', async () => {
    addSignupBlockMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_DOMAIN,
    });

    const result = await addBlockedDomainAction(INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
      },
    });
  });

  it('returns a server error and logs when the write fails', async () => {
    addSignupBlockMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await addBlockedDomainAction(INPUT);
    const [, context] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(context).toEqual({ error: ERROR_CODE.DB_NOT_FOUND });
  });

  it('returns a server error when the write throws', async () => {
    addSignupBlockMock.mockRejectedValue(new Error('db down'));

    const result = await addBlockedDomainAction(INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
