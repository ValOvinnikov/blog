import type { TVoicePortableText, TVoiceFieldId } from '@blog/config';
import { faker } from '@faker-js/faker';

import {
  isVoicePlainCopyOf,
  voiceTextToPortableText,
} from './voice-portable-text';

faker.seed(6419);

const FIELD_ID = 'notFoundSupportingText' satisfies TVoiceFieldId;
const MOCK_LEAD_TEXT = faker.lorem.words(2);
const MOCK_OTHER_TEXT = faker.lorem.word();
const MOCK_LINK_KEY = faker.string.uuid();
const MOCK_MARKED_TEXT: TVoicePortableText = [
  {
    _type: 'block',
    _key: faker.string.uuid(),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: faker.string.uuid(),
        text: MOCK_LEAD_TEXT,
        marks: ['strong', MOCK_LINK_KEY],
      },
    ],
    markDefs: [
      { _type: 'link', _key: MOCK_LINK_KEY, href: faker.internet.url() },
    ],
  },
];

describe(isVoicePlainCopyOf, () => {
  it('accepts a single unmarked paragraph of the same text', () => {
    const value = voiceTextToPortableText(FIELD_ID, MOCK_LEAD_TEXT);

    expect(isVoicePlainCopyOf(value, MOCK_LEAD_TEXT)).toBe(true);
  });

  it('rejects a paragraph of different text', () => {
    const value = voiceTextToPortableText(FIELD_ID, MOCK_LEAD_TEXT);

    expect(isVoicePlainCopyOf(value, MOCK_OTHER_TEXT)).toBe(false);
  });

  it('rejects the same text once a mark or link is applied', () => {
    expect(isVoicePlainCopyOf(MOCK_MARKED_TEXT, MOCK_LEAD_TEXT)).toBe(false);
  });
});
