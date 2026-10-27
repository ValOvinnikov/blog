import {
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import es from '@platform/i18n/messages/es.json';
import fr from '@platform/i18n/messages/fr.json';
import nl from '@platform/i18n/messages/nl.json';

import {
  buildVoiceDraft,
  countLanguageVoiceChanges,
  countVoiceChanges,
  toVoiceOverridesInput,
  voiceDefaultText,
  voiceErrorReveal,
  voiceErrorsInOrder,
  withVoiceValue,
  type TVoiceFieldError,
} from './voice-draft';

faker.seed(6006);

const { EN, DE, FR } = LOCALE_ISO_CODES;

const HEADING_ID = 'notFoundHeading' satisfies TVoiceFieldId;
const SUPPORTING_TEXT_ID = 'notFoundSupportingText' satisfies TVoiceFieldId;
const BLOG_LIST_EMPTY_ID = 'blogListEmpty' satisfies TVoiceFieldId;
const BOOKMARKS_EMPTY_ID = 'bookmarksEmpty' satisfies TVoiceFieldId;
const TOPIC_EMPTY_ID = 'topicEmpty' satisfies TVoiceFieldId;

const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_DE_HEADING = faker.lorem.words(2);
const MOCK_FR_HEADING = faker.lorem.words(2);
const MOCK_LEGACY_TEXT = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_DE_ERROR = faker.lorem.sentence();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_LEAD_SPAN_KEY = faker.string.uuid();
const MOCK_LINK_SPAN_KEY = faker.string.uuid();
const MOCK_LINK_KEY = faker.string.uuid();
const MOCK_LEAD_TEXT = faker.lorem.words(2);
const MOCK_LINK_TEXT = faker.lorem.word();
const MOCK_RICH_TEXT: TVoicePortableText = [
  {
    _type: 'block',
    _key: MOCK_BLOCK_KEY,
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: MOCK_LEAD_SPAN_KEY,
        text: MOCK_LEAD_TEXT,
        marks: [],
      },
      {
        _type: 'span',
        _key: MOCK_LINK_SPAN_KEY,
        text: MOCK_LINK_TEXT,
        marks: ['strong', MOCK_LINK_KEY],
      },
    ],
    markDefs: [
      { _type: 'link', _key: MOCK_LINK_KEY, href: faker.internet.url() },
    ],
  },
];

const notFoundField = VOICE_FIELDS.find(({ id }) => id === HEADING_ID)!;
const topicField = VOICE_FIELDS.find(({ id }) => id === TOPIC_EMPTY_ID)!;

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

describe(toVoiceOverridesInput, () => {
  it('sends customised values unflattened and leaves defaults out', () => {
    const draft = buildVoiceDraft(
      {
        [EN]: {
          [HEADING_ID]: MOCK_EN_HEADING,
          [SUPPORTING_TEXT_ID]: MOCK_RICH_TEXT,
        },
      },
      [EN],
    );

    const input = toVoiceOverridesInput(draft, [EN]);

    expect(input).toEqual({
      [EN]: {
        [HEADING_ID]: MOCK_EN_HEADING,
        [SUPPORTING_TEXT_ID]: MOCK_RICH_TEXT,
      },
    });
  });

  it('sends an empty map for a language whose overrides were all cleared', () => {
    const saved = buildVoiceDraft({ [DE]: { [HEADING_ID]: MOCK_DE_HEADING } }, [
      EN,
      DE,
    ]);
    const draft = withVoiceValue(saved, DE, HEADING_ID, '');

    const input = toVoiceOverridesInput(draft, [EN, DE]);

    expect(input).toEqual({ [EN]: {}, [DE]: {} });
  });
});

const changedDrafts = () => {
  const saved = buildVoiceDraft({}, [EN, DE]);
  const draft = withVoiceValue(
    withVoiceValue(
      withVoiceValue(saved, EN, HEADING_ID, MOCK_EN_HEADING),
      DE,
      HEADING_ID,
      MOCK_DE_HEADING,
    ),
    DE,
    BOOKMARKS_EMPTY_ID,
    MOCK_RICH_TEXT,
  );
  return { saved, draft };
};

describe(countVoiceChanges, () => {
  it('counts every changed field across languages', () => {
    const { saved, draft } = changedDrafts();

    const count = countVoiceChanges(saved, draft, [EN, DE]);

    expect(count).toBe(3);
  });
});

describe(countLanguageVoiceChanges, () => {
  it('counts only the changes in the given language', () => {
    const { saved, draft } = changedDrafts();

    const count = countLanguageVoiceChanges(saved, draft, DE);

    expect(count).toBe(2);
  });
});

describe(voiceDefaultText, () => {
  it.each([
    [DE, notFoundField, SITE_MESSAGES_BY_LOCALE.DE.notFound.heading],
    [EN, topicField, SITE_MESSAGES_BY_LOCALE.EN.topicPage.empty],
  ])("reads the field's catalog default in %s", (locale, field, expected) => {
    const text = voiceDefaultText(locale, field);

    expect(text).toBe(expected);
  });
});

describe('platform voice catalogs', () => {
  it.each(Object.entries({ en, de, es, fr, nl }))(
    'labels every Voice field and surface in %s',
    (_, messages) => {
      for (const { id } of VOICE_FIELDS) {
        expect(messages.voiceFieldLabels[id]).toBeTruthy();
        expect(messages.voiceFieldHints[id]).toBeTruthy();
      }
      for (const surface of Object.values(VOICE_SURFACE)) {
        expect(messages.voiceSurfaces[surface]).toBeTruthy();
        expect(messages.voiceSurfaceDescriptions[surface]).toBeTruthy();
      }
    },
  );
});

describe(voiceErrorsInOrder, () => {
  it("lists one language's errors in the order the page shows its fields", () => {
    const errors = voiceErrorsInOrder(
      {
        [EN]: {
          [BOOKMARKS_EMPTY_ID]: MOCK_ERROR,
          [BLOG_LIST_EMPTY_ID]: MOCK_ERROR,
          [HEADING_ID]: MOCK_ERROR,
        },
      },
      EN,
      [EN],
    );

    expect(errors).toEqual([
      { locale: EN, fieldId: HEADING_ID },
      { locale: EN, fieldId: BLOG_LIST_EMPTY_ID },
      { locale: EN, fieldId: BOOKMARKS_EMPTY_ID },
    ]);
  });

  it('lists the selected language first and counts a field once per language', () => {
    const errors = voiceErrorsInOrder(
      {
        [EN]: { [HEADING_ID]: MOCK_ERROR },
        [DE]: { [HEADING_ID]: MOCK_DE_ERROR },
      },
      DE,
      [EN, DE],
    );

    expect(errors).toEqual([
      { locale: DE, fieldId: HEADING_ID },
      { locale: EN, fieldId: HEADING_ID },
    ]);
  });

  it('skips cleared errors and languages that are not live', () => {
    const errors = voiceErrorsInOrder(
      {
        [EN]: { [HEADING_ID]: undefined },
        [FR]: { [HEADING_ID]: MOCK_ERROR },
      },
      EN,
      [EN, DE],
    );

    expect(errors).toEqual([]);
  });
});

describe(voiceErrorReveal, () => {
  it.each<[string, TVoiceFieldError, ReturnType<typeof voiceErrorReveal>]>([
    [
      'the language and the list a list field error sits in',
      { locale: DE, fieldId: TOPIC_EMPTY_ID },
      { locale: DE, listFieldId: TOPIC_EMPTY_ID },
    ],
    [
      'only the language for an error outside the lists',
      { locale: FR, fieldId: HEADING_ID },
      { locale: FR, listFieldId: undefined },
    ],
  ])('opens %s', (_, error, expected) => {
    const reveal = voiceErrorReveal(error);

    expect(reveal).toEqual(expected);
  });
});
