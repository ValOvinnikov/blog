import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { inlineLinkFragment } from '@blog/service/shared/fragments/link/inline-link';
import { tagFragment } from '@blog/service/shared/fragments/tag/tag';
import { topicFragment } from '@blog/service/shared/fragments/topic/topic';
import {
  MOCK_TAG_SLUG,
  MOCK_TOPIC_SLUG,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_LINK_LABEL,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

faker.seed(6019);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_TAG_WITH_PAGE_ID = faker.string.uuid();
const MOCK_TAG_WITHOUT_PAGE_ID = faker.string.uuid();
const MOCK_TAG_OTHER_LANGUAGE_ID = faker.string.uuid();
const MOCK_TOPIC_WITH_PAGE_ID = faker.string.uuid();
const MOCK_TOPIC_WITHOUT_PAGE_ID = faker.string.uuid();
const MOCK_TOPIC_OTHER_LANGUAGE_ID = faker.string.uuid();
const MOCK_TOPIC_LINK_ID = faker.string.uuid();
const MOCK_OTHER_LANGUAGE_TOPIC_LINK_ID = faker.string.uuid();
const MOCK_DUTCH_TAG_SLUG = faker.lorem.slug(2);
const MOCK_DUTCH_TOPIC_SLUG = faker.lorem.slug(2);
const MOCK_DUTCH_ONLY_SLUG = faker.lorem.slug(2);
const MOCK_TITLE = mockLocalizedStrings({ [EN]: faker.lorem.words(2) });

function mockArchivePage(
  _type: 'page_tag' | 'page_topic',
  termId: string,
  slug: string,
  language: string,
) {
  const termField = _type === 'page_tag' ? 'tag' : 'topic';

  return {
    _id: faker.string.uuid(),
    _type,
    slug: { current: slug },
    [termField]: mockReference(termId),
    language,
  };
}

function mockTopicLink(_id: string, topicId: string) {
  return {
    _id,
    _type: 'inlineLink',
    label: MOCK_LINK_LABEL,
    linkType: LINK_TYPE.INTERNAL,
    internalReference: mockReference(topicId),
  };
}

const dataset = [
  ...[
    MOCK_TAG_WITH_PAGE_ID,
    MOCK_TAG_WITHOUT_PAGE_ID,
    MOCK_TAG_OTHER_LANGUAGE_ID,
  ].map((_id) => ({ _id, _type: 'blog_tag', title: MOCK_TITLE })),
  ...[
    MOCK_TOPIC_WITH_PAGE_ID,
    MOCK_TOPIC_WITHOUT_PAGE_ID,
    MOCK_TOPIC_OTHER_LANGUAGE_ID,
  ].map((_id) => ({ _id, _type: 'blog_topic', title: MOCK_TITLE })),
  mockArchivePage('page_tag', MOCK_TAG_WITH_PAGE_ID, MOCK_TAG_SLUG, EN),
  mockArchivePage('page_tag', MOCK_TAG_WITH_PAGE_ID, MOCK_DUTCH_TAG_SLUG, NL),
  mockArchivePage(
    'page_tag',
    MOCK_TAG_OTHER_LANGUAGE_ID,
    MOCK_DUTCH_ONLY_SLUG,
    NL,
  ),
  mockArchivePage('page_topic', MOCK_TOPIC_WITH_PAGE_ID, MOCK_TOPIC_SLUG, EN),
  mockArchivePage(
    'page_topic',
    MOCK_TOPIC_WITH_PAGE_ID,
    MOCK_DUTCH_TOPIC_SLUG,
    NL,
  ),
  mockArchivePage(
    'page_topic',
    MOCK_TOPIC_OTHER_LANGUAGE_ID,
    MOCK_DUTCH_ONLY_SLUG,
    NL,
  ),
  mockTopicLink(MOCK_TOPIC_LINK_ID, MOCK_TOPIC_WITH_PAGE_ID),
  mockTopicLink(
    MOCK_OTHER_LANGUAGE_TOPIC_LINK_ID,
    MOCK_TOPIC_OTHER_LANGUAGE_ID,
  ),
];

const tagDocQuery = q.star
  .filterByType('blog_tag')
  .slice(0)
  .project(tagFragment);
const topicDocQuery = q.star
  .filterByType('blog_topic')
  .slice(0)
  .project(topicFragment);
const linkDocQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment);

function evaluateById(query: string, id: string, locale: string) {
  return evaluateGroqExpression(
    `*[_id == "${id}"][0]${query.slice(query.indexOf('{'))}`,
    dataset,
    null,
    { locale, defaultLocale: EN },
  );
}

async function resolveTermSlug(
  docQuery: typeof tagDocQuery | typeof topicDocQuery,
  id: string,
  locale: string,
) {
  const raw = await evaluateById(docQuery.query, id, locale);

  return docQuery.parse(raw)?.slug;
}

describe('archive page slug', () => {
  it.each([
    {
      behaviour: 'resolves a tag to the slug of its English page',
      docQuery: tagDocQuery,
      id: MOCK_TAG_WITH_PAGE_ID,
      locale: EN,
      expected: MOCK_TAG_SLUG,
    },
    {
      behaviour: 'resolves a tag to the slug of its Dutch page',
      docQuery: tagDocQuery,
      id: MOCK_TAG_WITH_PAGE_ID,
      locale: NL,
      expected: MOCK_DUTCH_TAG_SLUG,
    },
    {
      behaviour: 'resolves a tag with no archive page to null',
      docQuery: tagDocQuery,
      id: MOCK_TAG_WITHOUT_PAGE_ID,
      locale: EN,
      expected: null,
    },
    {
      behaviour:
        'resolves a tag whose only page is in another language to null',
      docQuery: tagDocQuery,
      id: MOCK_TAG_OTHER_LANGUAGE_ID,
      locale: EN,
      expected: null,
    },
    {
      behaviour: 'resolves a topic to the slug of its English page',
      docQuery: topicDocQuery,
      id: MOCK_TOPIC_WITH_PAGE_ID,
      locale: EN,
      expected: MOCK_TOPIC_SLUG,
    },
    {
      behaviour: 'resolves a topic to the slug of its Dutch page',
      docQuery: topicDocQuery,
      id: MOCK_TOPIC_WITH_PAGE_ID,
      locale: NL,
      expected: MOCK_DUTCH_TOPIC_SLUG,
    },
    {
      behaviour: 'resolves a topic with no archive page to null',
      docQuery: topicDocQuery,
      id: MOCK_TOPIC_WITHOUT_PAGE_ID,
      locale: EN,
      expected: null,
    },
    {
      behaviour:
        'resolves a topic whose only page is in another language to null',
      docQuery: topicDocQuery,
      id: MOCK_TOPIC_OTHER_LANGUAGE_ID,
      locale: EN,
      expected: null,
    },
  ])('$behaviour', async ({ docQuery, id, locale, expected }) => {
    const slug = await resolveTermSlug(docQuery, id, locale);

    expect(slug).toBe(expected);
  });

  it.each([
    {
      outcome: 'to its English page slug',
      id: MOCK_TOPIC_LINK_ID,
      locale: EN,
      expected: MOCK_TOPIC_SLUG,
    },
    {
      outcome: 'to its Dutch page slug',
      id: MOCK_TOPIC_LINK_ID,
      locale: NL,
      expected: MOCK_DUTCH_TOPIC_SLUG,
    },
    {
      outcome: 'whose only page is in another language to null',
      id: MOCK_OTHER_LANGUAGE_TOPIC_LINK_ID,
      locale: EN,
      expected: null,
    },
  ])(
    'resolves an inline topic link $outcome',
    async ({ id, locale, expected }) => {
      const raw = await evaluateById(linkDocQuery.query, id, locale);

      const link = linkDocQuery.parse(raw);

      expect(link?.internalReference).toEqual({
        _type: 'blog_topic',
        slug: expected,
      });
    },
  );
});
