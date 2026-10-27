import { portableTextToPlainText } from '@blog/config';
import { faker } from '@faker-js/faker';

import { wrapVoiceText } from './wrap-voice-text';

faker.seed(6012);

const MOCK_TEXT = faker.lorem.sentence();

describe(wrapVoiceText, () => {
  it.each([
    { case: 'the given text', text: MOCK_TEXT },
    { case: 'an empty string', text: '' },
  ])(
    'wraps $case as a single block that reads back as the same text',
    ({ text }) => {
      const result = wrapVoiceText(text);

      expect(result).toHaveLength(1);
      expect(portableTextToPlainText(result)).toBe(text);
    },
  );
});
