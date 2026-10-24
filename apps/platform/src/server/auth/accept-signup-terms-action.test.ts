import {
  ACTION_OUTCOME,
  NEXT_NAVIGATION_ERROR,
  SIGNUP_TERMS_COOKIE_NAME,
  TERMS_VERSION,
} from '@blog/config';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_LOG,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { checkBotId } from 'botid/server';
import { redirect } from 'next/navigation';

import { acceptSignupTermsAction } from './accept-signup-terms-action';

const { setCookieMock } = vi.hoisted(() => ({ setCookieMock: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: setCookieMock })),
}));

vi.mock('botid/server', () => ({ checkBotId: vi.fn() }));

const checkBotIdMock = vi.mocked(checkBotId);

const mockBotVerdict = (isBot: boolean) => {
  checkBotIdMock.mockResolvedValue({
    isBot,
  } as Awaited<ReturnType<typeof checkBotId>>);
};

const MOCK_REFUSED_RESULT = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
};

describe(acceptSignupTermsAction, () => {
  beforeEach(() => {
    setCookieMock.mockReset();
    checkBotIdMock.mockReset();
    mockBotVerdict(false);
  });

  it('records the current terms version and sends the visitor on to sign in', async () => {
    await expect(
      acceptSignupTermsAction({ hasAcceptedTerms: true }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(setCookieMock).toHaveBeenCalledWith(
      SIGNUP_TERMS_COOKIE_NAME,
      TERMS_VERSION,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(redirect).toHaveBeenCalledWith(
      adminRoutes.signIn(adminRoutes.home()),
    );
  });

  it('refuses a visitor who has not accepted the terms, before any bot check', async () => {
    const result = await acceptSignupTermsAction({ hasAcceptedTerms: false });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
      },
    });
    expect(checkBotIdMock).not.toHaveBeenCalled();
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it('refuses a bot with the neutral message and records nothing', async () => {
    mockBotVerdict(true);

    const result = await acceptSignupTermsAction({ hasAcceptedTerms: true });

    expect(result).toEqual(MOCK_REFUSED_RESULT);
    expect(setCookieMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(SIGN_UP_LOG.BOT_REFUSED);
  });

  it('refuses and logs when the bot check itself fails', async () => {
    const error = new Error('BotID unreachable');
    checkBotIdMock.mockRejectedValue(error);

    const result = await acceptSignupTermsAction({ hasAcceptedTerms: true });

    expect(result).toEqual(MOCK_REFUSED_RESULT);
    expect(setCookieMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(SIGN_UP_LOG.BOT_CHECK_FAILED, {
      error,
    });
  });
});
