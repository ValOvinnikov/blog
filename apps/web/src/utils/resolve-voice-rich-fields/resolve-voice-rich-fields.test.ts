import { VOICE_FIELD_KIND, VOICE_FIELDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import { wrapVoiceText } from '@web/utils/wrap-voice-text';

import { resolveVoiceRichFields } from './resolve-voice-rich-fields';

type TResolvedVoiceRichFields = ReturnType<typeof resolveVoiceRichFields>;

faker.seed(6012);

const MOCK_BLOG_LIST_EMPTY = faker.lorem.sentence();
const MOCK_TOPIC_EMPTY = faker.lorem.sentence();
const MOCK_PLAIN_OVERRIDE = faker.lorem.sentence();
const MOCK_RICH_OVERRIDE_TEXT = faker.lorem.sentence();

const MOCK_BASE_MESSAGES = {
  blogListPage: { empty: MOCK_BLOG_LIST_EMPTY },
  topicPage: { empty: MOCK_TOPIC_EMPTY },
};

describe(resolveVoiceRichFields, () => {
  it('returns the stored override unflattened for a field that has one', () => {
    const override = mockVoiceRichText(MOCK_RICH_OVERRIDE_TEXT);

    const result = resolveVoiceRichFields(
      { blogListEmpty: override },
      MOCK_BASE_MESSAGES,
    );

    expect(result.blogListEmpty).toBe(override);
  });

  it.each<{
    case: string;
    overrides: Record<string, string>;
    pick: (result: TResolvedVoiceRichFields) => unknown;
    text: string;
  }>([
    {
      case: 'the catalog string when no override exists',
      overrides: {},
      pick: (result) => result.blogListEmpty,
      text: MOCK_BLOG_LIST_EMPTY,
    },
    {
      case: 'a plain-string override',
      overrides: { topicEmpty: MOCK_PLAIN_OVERRIDE },
      pick: (result) => result.topicEmpty,
      text: MOCK_PLAIN_OVERRIDE,
    },
  ])('wraps $case as a single paragraph', ({ overrides, pick, text }) => {
    const result = resolveVoiceRichFields(overrides, MOCK_BASE_MESSAGES);

    expect(pick(result)).toEqual(wrapVoiceText(text));
  });

  it('resolves every rich voice field, not only the ones with overrides', () => {
    const richFieldIds = VOICE_FIELDS.filter(
      (field) => field.kind === VOICE_FIELD_KIND.RICH,
    ).map((field) => field.id);

    const result = resolveVoiceRichFields({}, MOCK_BASE_MESSAGES);

    expect(Object.keys(result)).toEqual(richFieldIds);
  });
});
