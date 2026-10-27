import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  MOCK_TOPIC_ID,
} from '@blog/service/testing/entities/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTranslationLink } from '@blog/service/testing/shared/localized';

const { EN, NL } = LOCALE_ISO_CODES;

export const MOCK_DESIGN_EN_POST_ID = 'design-en';
export const MOCK_DESIGN_NL_POST_ID = 'design-nl';
export const MOCK_NOTES_EN_POST_ID = 'notes-en';
export const MOCK_ONLY_EN_POST_ID = 'only-en';
export const MOCK_SCHEDULED_NL_POST_ID = 'scheduled-nl';
export const MOCK_SOLO_NL_POST_ID = 'solo-nl';
export const MOCK_LAUNCH_EN_POST_ID = 'launch-en';
const LAUNCH_NL_POST_ID = 'launch-nl';

export const MOCK_HERO_IMAGE_FIELD = 'heroImage';
export const MOCK_WORD_COUNT_FIELD = 'wordCount';

export const MOCK_PUBLISHED_FEED_SLUGS: Record<string, string[]> = {
  [EN]: [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID, MOCK_NOTES_EN_POST_ID],
  [NL]: [MOCK_DESIGN_NL_POST_ID],
};

const PUBLISHED_AT_LATER = '2026-01-02T00:00:00Z';
const PUBLISHED_AT_FUTURE = '2999-01-01T00:00:00Z';
const TRANSLATION_METADATA_TYPE = 'translation.metadata';

function post(
  id: string,
  language: string,
  { featured = false, publishedAt = '2026-01-01T00:00:00Z' } = {},
) {
  return {
    _id: id,
    _type: 'page_post',
    slug: { current: id },
    language,
    featured,
    publishedAt,
    topic: mockReference(MOCK_TOPIC_ID),
    tags: [mockReference(MOCK_TAG_ID, { _key: MOCK_TAG_ID })],
  };
}

export const MOCK_TRANSLATED_POST_DOCUMENTS = [
  { _id: MOCK_TOPIC_ID, _type: 'blog_topic' },
  { _id: MOCK_TAG_ID, _type: 'blog_tag' },
  post(MOCK_DESIGN_EN_POST_ID, EN, {
    featured: true,
    publishedAt: PUBLISHED_AT_LATER,
  }),
  post(MOCK_DESIGN_NL_POST_ID, NL, {
    featured: true,
    publishedAt: PUBLISHED_AT_LATER,
  }),
  post(MOCK_NOTES_EN_POST_ID, EN),
  post(MOCK_ONLY_EN_POST_ID, EN, {
    featured: true,
    publishedAt: '2026-01-03T00:00:00Z',
  }),
  post(MOCK_SCHEDULED_NL_POST_ID, NL, { publishedAt: PUBLISHED_AT_FUTURE }),
  {
    _id: 'meta-design',
    _type: TRANSLATION_METADATA_TYPE,
    translations: [
      mockTranslationLink(EN, MOCK_DESIGN_EN_POST_ID),
      mockTranslationLink(NL, MOCK_DESIGN_NL_POST_ID),
    ],
  },
];

export const MOCK_PINNED_POST_DOCUMENTS = [
  ...MOCK_TRANSLATED_POST_DOCUMENTS,
  post(MOCK_SOLO_NL_POST_ID, NL),
  post(MOCK_LAUNCH_EN_POST_ID, EN),
  post(LAUNCH_NL_POST_ID, NL, { publishedAt: PUBLISHED_AT_FUTURE }),
  {
    _id: 'meta-launch',
    _type: TRANSLATION_METADATA_TYPE,
    translations: [
      mockTranslationLink(EN, MOCK_LAUNCH_EN_POST_ID),
      mockTranslationLink(NL, LAUNCH_NL_POST_ID),
    ],
  },
];

export function toIds(posts: unknown): string[] {
  return (posts as ({ _id: string } | null)[]).flatMap((post) =>
    post ? [post._id] : [],
  );
}

export function evaluateRelatedPostsQuery(
  query: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  return evaluateGroqExpression(
    query,
    MOCK_TRANSLATED_POST_DOCUMENTS,
    undefined,
    { currentId: MOCK_NOTES_EN_POST_ID, defaultLocale: EN, ...params },
  );
}
