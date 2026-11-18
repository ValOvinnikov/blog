import { faker } from '@faker-js/faker';
import {
  MOCK_SIGN_IN_URL,
  MOCK_UNSAFE_URL,
} from '@shinefold/email/testing/email-fixtures';

import { buildPlainTextBody } from './plain-text-body';

faker.seed(6026);

const MOCK_PARAGRAPH = faker.lorem.sentence();
const MOCK_SECOND_PARAGRAPH = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_SECOND_ACTION_LABEL = faker.lorem.words(3);

describe(buildPlainTextBody, () => {
  it('separates each paragraph with a blank line', () => {
    expect(buildPlainTextBody([MOCK_PARAGRAPH, MOCK_SECOND_PARAGRAPH])).toBe(
      `${MOCK_PARAGRAPH}\n\n${MOCK_SECOND_PARAGRAPH}`,
    );
  });

  it.each([
    [
      'ends with the action label and its url',
      MOCK_SIGN_IN_URL,
      MOCK_SIGN_IN_URL,
    ],
    ['drops an action url that is not a safe link', MOCK_UNSAFE_URL, ''],
  ])('%s', (_title, url, expectedUrl) => {
    expect(
      buildPlainTextBody([MOCK_PARAGRAPH], { label: MOCK_ACTION_LABEL, url }),
    ).toBe(`${MOCK_PARAGRAPH}\n\n${MOCK_ACTION_LABEL}: ${expectedUrl}`);
  });

  it('lists each action on its own line, in order', () => {
    expect(
      buildPlainTextBody(
        [MOCK_PARAGRAPH],
        { label: MOCK_ACTION_LABEL, url: MOCK_SIGN_IN_URL },
        { label: MOCK_SECOND_ACTION_LABEL, url: MOCK_SIGN_IN_URL },
      ),
    ).toBe(
      `${MOCK_PARAGRAPH}\n\n${MOCK_ACTION_LABEL}: ${MOCK_SIGN_IN_URL}\n\n${MOCK_SECOND_ACTION_LABEL}: ${MOCK_SIGN_IN_URL}`,
    );
  });
});
