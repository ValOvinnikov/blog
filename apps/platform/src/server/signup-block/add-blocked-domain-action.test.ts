import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  SIGNUP_BLOCK_FIELD_ERROR,
  SIGNUP_BLOCK_LOG,
} from '@platform/constants/signup-block';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_DOMAIN,
  mockBlockedIdentity,
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

faker.seed(6106);

const MOCK_ADMIN = mockAdmin();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_INPUT = {
  domain: ` ${MOCK_BLOCKED_DOMAIN} `,
  reason: ` ${MOCK_BLOCK_REASON} `,
};

describe(addBlockedDomainAction, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(MOCK_ADMIN);
    addSignupBlockMock
      .mockReset()
      .mockResolvedValue(
        okResult({ entry: mockBlockedIdentity(), created: true }),
      );
  });

  it('rejects a caller who is not a super admin', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(addBlockedDomainAction(MOCK_INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(addSignupBlockMock).not.toHaveBeenCalled();
  });

  it('adds the trimmed domain with the trimmed reason as the admin', async () => {
    const result = await addBlockedDomainAction(MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(addSignupBlockMock).toHaveBeenCalledWith({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
      admin: MOCK_ADMIN,
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
    addSignupBlockMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_INVALID_DOMAIN),
    );

    const result = await addBlockedDomainAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
      },
    });
  });

  it('returns a server error and logs when the write fails', async () => {
    addSignupBlockMock.mockResolvedValue(errorResult(ERROR_CODE.DB_NOT_FOUND));

    const result = await addBlockedDomainAction(MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SIGNUP_BLOCK_LOG.ADD_DOMAIN_FAILED,
      { error: ERROR_CODE.DB_NOT_FOUND },
    );
  });

  it('returns a server error when the write throws', async () => {
    addSignupBlockMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await addBlockedDomainAction(MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SIGNUP_BLOCK_LOG.ADD_DOMAIN_FAILED,
      { error: MOCK_DB_ERROR },
    );
  });
});
