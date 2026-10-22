import { ACTION_OUTCOME } from '@blog/config';
import {
  DISPLAY_NAME_UPDATE_FAILED_EVENT,
  PROVIDER_UNLINK_FAILED_EVENT,
} from '@web/constants/account';
import { FIELD_ERROR } from '@web/constants/field-error';
import { logger } from '@web/utils/logger/logger';

import type * as TIdentityActions from './identity-actions';

const { authMock, unlinkProviderMock, updateDisplayNameMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    unlinkProviderMock: vi.fn(),
    updateDisplayNameMock: vi.fn(),
  }),
);

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    account: {
      unlinkProvider: unlinkProviderMock,
      updateDisplayName: updateDisplayNameMock,
    },
  },
}));

const PROVIDER = 'github';

const session = {
  user: { id: 'user-1', email: 'jane@icloud.com' },
};

describe('unlinkProviderAction', () => {
  let unlinkProviderAction: (typeof TIdentityActions)['unlinkProviderAction'];

  beforeEach(async () => {
    authMock.mockReset();
    unlinkProviderMock.mockReset();
    authMock.mockResolvedValue(session);
    ({ unlinkProviderAction } = await import('./identity-actions'));
  });

  it('returns SERVER_ERROR without unlinking when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(unlinkProviderAction(PROVIDER)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(unlinkProviderMock).not.toHaveBeenCalled();
  });

  it('rejects a provider that is not literally "github" or "google" at runtime, without logging or querying it', async () => {
    await expect(
      unlinkProviderAction('DROP TABLE accounts;--' as typeof PROVIDER),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });

    expect(authMock).not.toHaveBeenCalled();
    expect(unlinkProviderMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it("unlinks the session user's provider and returns SUCCESS", async () => {
    unlinkProviderMock.mockResolvedValue({ outcome: 'unlinked' });

    await expect(unlinkProviderAction(PROVIDER)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(unlinkProviderMock).toHaveBeenCalledWith('user-1', PROVIDER);
  });

  it('returns BLOCKED when the db rejects the unlink', async () => {
    unlinkProviderMock.mockResolvedValue({ outcome: 'last-method' });

    await expect(unlinkProviderAction('google')).resolves.toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
  });

  it('returns SERVER_ERROR and logs when the unlink write throws', async () => {
    const error = new Error('boom');
    unlinkProviderMock.mockRejectedValue(error);

    await expect(unlinkProviderAction(PROVIDER)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      PROVIDER_UNLINK_FAILED_EVENT,
      { provider: PROVIDER, error },
    );
  });
});

describe('updateDisplayNameAction', () => {
  let updateDisplayNameAction: (typeof TIdentityActions)['updateDisplayNameAction'];

  beforeEach(async () => {
    authMock.mockReset();
    updateDisplayNameMock.mockReset();
    authMock.mockResolvedValue(session);
    ({ updateDisplayNameAction } = await import('./identity-actions'));
  });

  it('returns SERVER_ERROR without updating when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(updateDisplayNameAction('Jane')).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(updateDisplayNameMock).not.toHaveBeenCalled();
  });

  it('returns INVALID for the name without updating when the trimmed name is empty', async () => {
    await expect(updateDisplayNameAction('   ')).resolves.toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    });
    expect(updateDisplayNameMock).not.toHaveBeenCalled();
  });

  it('trims the name, updates it, and returns SUCCESS', async () => {
    updateDisplayNameMock.mockResolvedValue(undefined);

    await expect(updateDisplayNameAction('  Jane Doe  ')).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(updateDisplayNameMock).toHaveBeenCalledWith('user-1', 'Jane Doe');
  });

  it('returns SERVER_ERROR and logs when the db write throws', async () => {
    const error = new Error('boom');
    updateDisplayNameMock.mockRejectedValue(error);

    await expect(updateDisplayNameAction('Jane')).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      DISPLAY_NAME_UPDATE_FAILED_EVENT,
      { error },
    );
  });
});
