import {
  MOCK_SIGN_IN_URL,
  MOCK_UNSAFE_URL,
} from '@blog/email/testing/email-fixtures';

import { buildPlainTextBody } from './plain-text-body';

const PARAGRAPH = 'Your site is paused.';
const ACTION_LABEL = 'Sign in';

describe(buildPlainTextBody, () => {
  it('separates each paragraph with a blank line', () => {
    expect(buildPlainTextBody(['First.', 'Second.'])).toBe('First.\n\nSecond.');
  });

  it('ends with the action label and its url', () => {
    expect(
      buildPlainTextBody([PARAGRAPH], {
        label: ACTION_LABEL,
        url: MOCK_SIGN_IN_URL,
      }),
    ).toBe(`${PARAGRAPH}\n\n${ACTION_LABEL}: ${MOCK_SIGN_IN_URL}`);
  });

  it('drops an action url that is not a safe link', () => {
    expect(
      buildPlainTextBody([PARAGRAPH], {
        label: ACTION_LABEL,
        url: MOCK_UNSAFE_URL,
      }),
    ).toBe(`${PARAGRAPH}\n\n${ACTION_LABEL}: `);
  });
});
