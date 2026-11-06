import {
  SITE_MESSAGES_BY_LOCALE,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { voiceTextToPortableText } from '@platform/utils/voice-portable-text/voice-portable-text';

import { buildVoiceDraft } from './voice-draft-builder';

faker.seed(6006);

const { EN, DE, FR } = LOCALE_ISO_CODES;

const HEADING_ID = 'notFoundHeading' satisfies TVoiceFieldId;
const SUPPORTING_TEXT_ID = 'notFoundSupportingText' satisfies TVoiceFieldId;
const BLOG_LIST_EMPTY_ID = 'blogListEmpty' satisfies TVoiceFieldId;

const MOCK_DE_HEADING = faker.lorem.words(2);
const MOCK_FR_HEADING = faker.lorem.words(2);
const MOCK_LEGACY_TEXT = faker.lorem.sentence();
const MOCK_LINK_KEY = faker.string.uuid();
const MOCK_RICH_TEXT: TVoicePortableText = [
  {
    _type: 'block',
    _key: faker.string.uuid(),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: faker.string.uuid(),
        text: faker.lorem.words(2),
        marks: ['strong', MOCK_LINK_KEY],
      },
    ],
    markDefs: [
      { _type: 'link', _key: MOCK_LINK_KEY, href: faker.internet.url() },
    ],
  },
];

describe(buildVoiceDraft, () => {
  it('keeps a stored rich value exactly as stored', () => {
    const draft = buildVoiceDraft(
      { [EN]: { [SUPPORTING_TEXT_ID]: MOCK_RICH_TEXT } },
      [EN],
    );

    expect(draft[EN]?.[SUPPORTING_TEXT_ID]).toEqual(MOCK_RICH_TEXT);
  });

  it('reads a legacy plain string on a rich field as one paragraph', () => {
    const draft = buildVoiceDraft(
      { [EN]: { [BLOG_LIST_EMPTY_ID]: MOCK_LEGACY_TEXT } },
      [EN],
    );

    expect(draft[EN]?.[BLOG_LIST_EMPTY_ID]).toEqual([
      {
        _type: 'block',
        _key: `${BLOG_LIST_EMPTY_ID}-block`,
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: `${BLOG_LIST_EMPTY_ID}-span`,
            text: MOCK_LEGACY_TEXT,
          },
        ],
      },
    ]);
  });

  it("reads stored text equal to its language's default as the empty value", () => {
    const draft = buildVoiceDraft(
      { [DE]: { [HEADING_ID]: SITE_MESSAGES_BY_LOCALE.DE.notFound.heading } },
      [DE],
    );

    expect(draft[DE]?.[HEADING_ID]).toBe('');
  });

  it("reads a stored plain paragraph equal to its language's default as null", () => {
    const draft = buildVoiceDraft(
      {
        [DE]: {
          [SUPPORTING_TEXT_ID]: voiceTextToPortableText(
            SUPPORTING_TEXT_ID,
            SITE_MESSAGES_BY_LOCALE.DE.notFound.supportingText,
          ),
        },
      },
      [DE],
    );

    expect(draft[DE]?.[SUPPORTING_TEXT_ID]).toBeNull();
  });

  it("keeps another language's default copy as a customisation", () => {
    const draft = buildVoiceDraft(
      { [DE]: { [HEADING_ID]: SITE_MESSAGES_BY_LOCALE.EN.notFound.heading } },
      [DE],
    );

    expect(draft[DE]?.[HEADING_ID]).toBe(
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
  });

  it('builds one map per live language, leaving untouched fields empty', () => {
    const draft = buildVoiceDraft(
      {
        [DE]: { [HEADING_ID]: MOCK_DE_HEADING },
        [FR]: { [HEADING_ID]: MOCK_FR_HEADING },
      },
      [EN, DE],
    );

    expect(Object.keys(draft)).toEqual([EN, DE]);
    expect(draft[EN]?.[HEADING_ID]).toBe('');
    expect(draft[EN]?.[SUPPORTING_TEXT_ID]).toBeNull();
    expect(draft[DE]?.[HEADING_ID]).toBe(MOCK_DE_HEADING);
  });
});
