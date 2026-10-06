import { LOCALE_ISO_CODES } from '@blog/config/constants';

const { EN, NL } = LOCALE_ISO_CODES;

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
    topic: { _type: 'reference', _ref: 'topic-1' },
    tags: [{ _key: 'tag-1', _type: 'reference', _ref: 'tag-1' }],
  };
}

function link(language: string, id: string) {
  return { _key: language, language, value: { _type: 'reference', _ref: id } };
}

export const translatedPostDocuments = [
  { _id: 'topic-1', _type: 'blog_topic' },
  { _id: 'tag-1', _type: 'blog_tag' },
  post('design-en', EN, {
    featured: true,
    publishedAt: '2026-01-02T00:00:00Z',
  }),
  post('design-nl', NL, {
    featured: true,
    publishedAt: '2026-01-02T00:00:00Z',
  }),
  post('notes-en', EN),
  post('only-en', EN, { featured: true, publishedAt: '2026-01-03T00:00:00Z' }),
  post('scheduled-nl', NL, { publishedAt: '2999-01-01T00:00:00Z' }),
  {
    _id: 'meta-design',
    _type: 'translation.metadata',
    translations: [link(EN, 'design-en'), link(NL, 'design-nl')],
  },
];

export function toIds(posts: unknown): string[] {
  return (posts as ({ _id: string } | null)[]).flatMap((post) =>
    post ? [post._id] : [],
  );
}
