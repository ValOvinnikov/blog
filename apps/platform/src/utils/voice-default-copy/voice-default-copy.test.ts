import { faker } from '@faker-js/faker';
import { voiceTextToPortableText } from '@platform/utils/voice-portable-text/voice-portable-text';

import { withoutDefaultCopy } from './voice-default-copy';

faker.seed(6419);

const MOCK_DEFAULT_TEXT = faker.lorem.words(3);
const MOCK_OTHER_TEXT = faker.lorem.words(2);

describe(withoutDefaultCopy, () => {
  it('reads text equal to the default as the empty value', () => {
    expect(withoutDefaultCopy(MOCK_DEFAULT_TEXT, MOCK_DEFAULT_TEXT)).toBe('');
  });

  it('keeps text that differs from the default', () => {
    expect(withoutDefaultCopy(MOCK_OTHER_TEXT, MOCK_DEFAULT_TEXT)).toBe(
      MOCK_OTHER_TEXT,
    );
  });

  it('reads one plain paragraph equal to the default as null', () => {
    const value = voiceTextToPortableText(
      'notFoundSupportingText',
      MOCK_DEFAULT_TEXT,
    );

    expect(withoutDefaultCopy(value, MOCK_DEFAULT_TEXT)).toBeNull();
  });

  it('keeps a rich value that differs from the default', () => {
    const value = voiceTextToPortableText(
      'notFoundSupportingText',
      MOCK_OTHER_TEXT,
    );

    expect(withoutDefaultCopy(value, MOCK_DEFAULT_TEXT)).toBe(value);
  });

  it('keeps null', () => {
    expect(withoutDefaultCopy(null, MOCK_DEFAULT_TEXT)).toBeNull();
  });
});
