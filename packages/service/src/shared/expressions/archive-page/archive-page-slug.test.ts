import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION,
  archivePageSlugParser,
} from './archive-page-slug';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const dataset = [
  { _id: 'design', _type: 'blog_topic' },
  {
    _id: 'design-en',
    _type: 'page_topic',
    topic: { _type: 'reference', _ref: 'design' },
    slug: { current: 'design' },
    language: EN,
  },
  {
    _id: 'design-nl',
    _type: 'page_topic',
    topic: { _type: 'reference', _ref: 'design' },
    slug: { current: 'ontwerp' },
    language: NL,
  },
];

function resolveSlug(locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == "design"][0]{ "slug": ${TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION} }.slug`,
    dataset,
    null,
    { locale },
  );
}

describe('TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION', () => {
  it('resolves the slug of the archive page in the request language', async () => {
    expect(await resolveSlug(EN)).toBe('design');
    expect(await resolveSlug(NL)).toBe('ontwerp');
  });

  it('resolves null when the term has no archive page in that language', async () => {
    expect(await resolveSlug(FR)).toBeNull();
  });
});

describe('archivePageSlugParser', () => {
  it('parses to a string', () => {
    expect(archivePageSlugParser.parse('engineering')).toBe('engineering');
  });

  it('parses a term with no archive page to null', () => {
    expect(archivePageSlugParser.parse(null)).toBeNull();
  });
});
