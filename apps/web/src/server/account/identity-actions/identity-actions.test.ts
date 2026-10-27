import { ACTION_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import {
  DISPLAY_NAME_UPDATE_FAILED_EVENT,
  PROVIDER_UNLINK_FAILED_EVENT,
} from '@web/constants/account';
import { FIELD_ERROR } from '@web/constants/field-error';
import { auth } from '@web/server/auth/auth';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { arrangeNoSessionOnce } from '@web/testing/shared/session/arrange-no-session-once';
import { MOCK_USER_ID } from '@web/testing/shared/session/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  type TLinkableProvider,
  unlinkProviderAction,
  updateDisplayNameAction,
} from './identity-actions';

vi.mock('@web/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    account: { unlinkProvider: vi.fn(), updateDisplayName: vi.fn() },
  },
}));

faker.seed(6010);

const MOCK_PROVIDER: TLinkableProvider = 'github';
const MOCK_OTHER_PROVIDER: TLinkableProvider = 'google';
const MOCK_UNSUPPORTED_PROVIDER =
  `${faker.lorem.word()};--` as TLinkableProvider;
const MOCK_DISPLAY_NAME = faker.person.fullName();

describe(unlinkProviderAction, () => {
  it('answers server-error without unlinking when there is no session', async () => {
    arrangeNoSessionOnce();

    const result = await unlinkProviderAction(MOCK_PROVIDER);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(queries.account.unlinkProvider).not.toHaveBeenCalled();
  });

  it('rejects an unsupported provider without signing in, logging or querying', async () => {
    const result = await unlinkProviderAction(MOCK_UNSUPPORTED_PROVIDER);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(auth).not.toHaveBeenCalled();
    expect(queries.account.unlinkProvider).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("unlinks the session user's provider and answers success", async () => {
    vi.mocked(queries.account.unlinkProvider).mockResolvedValueOnce(
      toOutcome('unlinked'),
    );

    const result = await unlinkProviderAction(MOCK_PROVIDER);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.account.unlinkProvider).toHaveBeenCalledWith(
      MOCK_USER_ID,
      MOCK_PROVIDER,
    );
  });

  it('answers blocked when the last sign-in method would be removed', async () => {
    vi.mocked(queries.account.unlinkProvider).mockResolvedValueOnce(
      toOutcome('last-method'),
    );

    const result = await unlinkProviderAction(MOCK_OTHER_PROVIDER);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
  });

  it('answers server-error and logs when the unlink write throws', async () => {
    vi.mocked(queries.account.unlinkProvider).mockRejectedValueOnce(MOCK_ERROR);

    const result = await unlinkProviderAction(MOCK_PROVIDER);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(PROVIDER_UNLINK_FAILED_EVENT, {
      provider: MOCK_PROVIDER,
      error: MOCK_ERROR,
    });
  });
});

describe(updateDisplayNameAction, () => {
  it('answers server-error without updating when there is no session', async () => {
    arrangeNoSessionOnce();

    const result = await updateDisplayNameAction(MOCK_DISPLAY_NAME);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(queries.account.updateDisplayName).not.toHaveBeenCalled();
  });

  it('names the field invalid without updating when the trimmed name is empty', async () => {
    const result = await updateDisplayNameAction('   ');

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    });
    expect(queries.account.updateDisplayName).not.toHaveBeenCalled();
  });

  it('trims the name, updates it and answers success', async () => {
    const result = await updateDisplayNameAction(`  ${MOCK_DISPLAY_NAME}  `);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.account.updateDisplayName).toHaveBeenCalledWith(
      MOCK_USER_ID,
      MOCK_DISPLAY_NAME,
    );
  });

  it('answers server-error and logs when the db write throws', async () => {
    vi.mocked(queries.account.updateDisplayName).mockRejectedValueOnce(
      MOCK_ERROR,
    );

    const result = await updateDisplayNameAction(MOCK_DISPLAY_NAME);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      DISPLAY_NAME_UPDATE_FAILED_EVENT,
      {
        error: MOCK_ERROR,
      },
    );
  });
});
