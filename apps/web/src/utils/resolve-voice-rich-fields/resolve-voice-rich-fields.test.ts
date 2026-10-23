import { VOICE_FIELD_KIND, VOICE_FIELDS } from '@blog/config';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import { wrapVoiceText } from '@web/utils/wrap-voice-text';

import { resolveVoiceRichFields } from './resolve-voice-rich-fields';

type TResolvedVoiceRichFields = ReturnType<typeof resolveVoiceRichFields>;

const BLOG_LIST_EMPTY = 'No posts yet.';
const PLAIN_OVERRIDE = 'Nothing here.';

const BASE_MESSAGES = {
  blogListPage: { empty: BLOG_LIST_EMPTY },
  topicPage: { empty: 'Nothing tagged {name} yet.' },
};

describe(resolveVoiceRichFields, () => {
  it('returns the stored override unflattened for a field that has one', () => {
    const override = mockVoiceRichText('Nothing published yet.');

    const result = resolveVoiceRichFields(
      { blogListEmpty: override },
      BASE_MESSAGES,
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
      text: BLOG_LIST_EMPTY,
    },
    {
      case: 'a plain-string override',
      overrides: { topicEmpty: PLAIN_OVERRIDE },
      pick: (result) => result.topicEmpty,
      text: PLAIN_OVERRIDE,
    },
  ])('wraps $case as a single paragraph', ({ overrides, pick, text }) => {
    const result = resolveVoiceRichFields(overrides, BASE_MESSAGES);

    expect(pick(result)).toEqual(wrapVoiceText(text));
  });

  it('resolves every RICH voice field, not only the ones with overrides', () => {
    const richFieldIds = VOICE_FIELDS.filter(
      (field) => field.kind === VOICE_FIELD_KIND.RICH,
    ).map((field) => field.id);

    const result = resolveVoiceRichFields({}, BASE_MESSAGES);

    expect(Object.keys(result)).toEqual(richFieldIds);
  });
});
