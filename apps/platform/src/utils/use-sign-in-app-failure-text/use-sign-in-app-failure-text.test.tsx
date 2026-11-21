import { SIGN_IN_APP_REFUSAL } from '@platform/constants/sign-in-apps';
import en from '@platform/i18n/messages/en.json';
import { renderHookWithIntl } from '@platform/testing/custom-render';
import { ACTION_OUTCOME } from '@shinefold/config';

import { useSignInAppFailureText } from './use-sign-in-app-failure-text';

const MOCK_FALLBACK = 'Something went wrong.';

describe(useSignInAppFailureText.name, () => {
  let failureText: ReturnType<typeof useSignInAppFailureText>;

  beforeEach(() => {
    failureText = renderHookWithIntl(() => useSignInAppFailureText()).result
      .current;
  });

  it('explains a refusal by its reason', () => {
    const text = failureText(
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGN_IN_APP_REFUSAL.NOT_ON_PLAN,
      },
      MOCK_FALLBACK,
    );

    expect(text).toBe(en.signInAppsPage.refusal.NOT_ON_PLAN);
  });

  it('falls back for a server error', () => {
    const text = failureText(
      { outcome: ACTION_OUTCOME.SERVER_ERROR },
      MOCK_FALLBACK,
    );

    expect(text).toBe(MOCK_FALLBACK);
  });
});
