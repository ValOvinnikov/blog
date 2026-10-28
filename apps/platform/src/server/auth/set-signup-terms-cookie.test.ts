import { SIGNUP_TERMS_COOKIE_NAME, TERMS_VERSION } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SIGN_UP_LOG } from '@platform/constants/sign-up';
import { logger } from '@platform/utils/logger/logger';
import { checkBotId } from 'botid/server';

import { setSignupTermsCookie } from './set-signup-terms-cookie';

const setCookieMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: setCookieMock })),
}));

vi.mock('botid/server', () => ({ checkBotId: vi.fn() }));

faker.seed(6186);

const MOCK_BOT_CHECK_ERROR = new Error(faker.lorem.sentence());

const mockBotIdVerdict = (isBot: boolean) => ({
  isHuman: !isBot,
  isBot,
  isVerifiedBot: false,
  bypassed: false,
});

describe(setSignupTermsCookie, () => {
  beforeEach(() => {
    setCookieMock.mockReset();
    vi.mocked(checkBotId).mockResolvedValue(mockBotIdVerdict(false));
  });

  it('marks the browser with the current terms version', async () => {
    await setSignupTermsCookie();

    const [cookieName, cookieValue, cookieOptions] =
      setCookieMock.mock.calls[0] ?? [];

    expect(cookieName).toBe(SIGNUP_TERMS_COOKIE_NAME);
    expect(cookieValue).toBe(TERMS_VERSION);
    expect(cookieOptions.httpOnly).toBe(true);
  });

  it('gives a bot no mark', async () => {
    vi.mocked(checkBotId).mockResolvedValueOnce(mockBotIdVerdict(true));

    await setSignupTermsCookie();

    expect(setCookieMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(SIGN_UP_LOG.BOT_REFUSED);
  });

  it('gives no mark and logs when the bot check itself fails', async () => {
    vi.mocked(checkBotId).mockRejectedValueOnce(MOCK_BOT_CHECK_ERROR);

    await setSignupTermsCookie();

    expect(setCookieMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(SIGN_UP_LOG.BOT_CHECK_FAILED, {
      errorName: MOCK_BOT_CHECK_ERROR.name,
    });
  });
});
