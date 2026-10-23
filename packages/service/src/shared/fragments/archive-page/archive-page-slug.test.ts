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
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

const TAG_WITH_PAGE_ID = 'tag-with-page';
const TAG_WITHOUT_PAGE_ID = 'tag-without-page';
const TAG_OTHER_LANGUAGE_ID = 'tag-other-language';
const TOPIC_WITH_PAGE_ID = 'topic-with-page';
const TOPIC_WITHOUT_PAGE_ID = 'topic-without-page';
const TOPIC_OTHER_LANGUAGE_ID = 'topic-other-language';
const DUTCH_TAG_SLUG = 'typescript-nl';
const TOPIC_LINK_ID = 'link-to-topic';
const OTHER_LANGUAGE_TOPIC_LINK_ID = 'link-to-topic-other-language';
const DUTCH_ONLY_SLUG = 'alleen-nl';
const { EN, NL } = LOCALE_ISO_CODES;

const localized = [{ _key: 'en', language: EN, value: 'Title' }];

const dataset = [
  { _id: TAG_WITH_PAGE_ID, _type: 'blog_tag', title: localized },
  { _id: TAG_WITHOUT_PAGE_ID, _type: 'blog_tag', title: localized },
  { _id: TAG_OTHER_LANGUAGE_ID, _type: 'blog_tag', title: localized },
  { _id: TOPIC_WITH_PAGE_ID, _type: 'blog_topic', title: localized },
  { _id: TOPIC_WITHOUT_PAGE_ID, _type: 'blog_topic', title: localized },
  { _id: TOPIC_OTHER_LANGUAGE_ID, _type: 'blog_topic', title: localized },
  {
    _id: 'page-tag-en',
    _type: 'page_tag',
    slug: { current: MOCK_TAG_SLUG },
    tag: mockReference(TAG_WITH_PAGE_ID),
    language: EN,
  },
  {
    _id: 'page-tag-nl',
    _type: 'page_tag',
    slug: { current: DUTCH_TAG_SLUG },
    tag: mockReference(TAG_WITH_PAGE_ID),
    language: NL,
  },
  {
    _id: 'page-tag-nl-only',
    _type: 'page_tag',
    slug: { current: DUTCH_ONLY_SLUG },
    tag: mockReference(TAG_OTHER_LANGUAGE_ID),
    language: NL,
  },
  {
    _id: 'page-topic-en',
    _type: 'page_topic',
    slug: { current: MOCK_TOPIC_SLUG },
    topic: mockReference(TOPIC_WITH_PAGE_ID),
    language: EN,
  },
  {
    _id: 'page-topic-nl',
    _type: 'page_topic',
    slug: { current: 'techniek' },
    topic: mockReference(TOPIC_WITH_PAGE_ID),
    language: NL,
  },
  {
    _id: 'page-topic-nl-only',
    _type: 'page_topic',
    slug: { current: DUTCH_ONLY_SLUG },
    topic: mockReference(TOPIC_OTHER_LANGUAGE_ID),
    language: NL,
  },
  {
    _id: TOPIC_LINK_ID,
    _type: 'inlineLink',
    label: 'Topic',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: mockReference(TOPIC_WITH_PAGE_ID),
  },
  {
    _id: OTHER_LANGUAGE_TOPIC_LINK_ID,
    _type: 'inlineLink',
    label: 'Topic',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: mockReference(TOPIC_OTHER_LANGUAGE_ID),
  },
];

function run(query: string, id: string, locale: string) {
  return evaluateGroqExpression(
    `*[_id == "${id}"][0]${query.slice(query.indexOf('{'))}`,
    dataset,
    null,
    { locale, defaultLocale: EN },
  );
}

const tagQuery = q.star
  .filterByType('blog_tag')
  .slice(0)
  .project(tagFragment).query;
const topicQuery = q.star
  .filterByType('blog_topic')
  .slice(0)
  .project(topicFragment).query;
const linkQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment).query;

describe('archive page slug', () => {
  it('resolves a tag to the slug of its page in the reader language', async () => {
    expect(await run(tagQuery, TAG_WITH_PAGE_ID, EN)).toMatchObject({
      slug: MOCK_TAG_SLUG,
    });
    expect(await run(tagQuery, TAG_WITH_PAGE_ID, NL)).toMatchObject({
      slug: DUTCH_TAG_SLUG,
    });
  });

  it('resolves a tag with no archive page to null', async () => {
    expect(await run(tagQuery, TAG_WITHOUT_PAGE_ID, EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a tag whose only page is in another language to null', async () => {
    expect(await run(tagQuery, TAG_OTHER_LANGUAGE_ID, EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a topic to the slug of its page in the reader language', async () => {
    expect(await run(topicQuery, TOPIC_WITH_PAGE_ID, EN)).toMatchObject({
      slug: MOCK_TOPIC_SLUG,
    });
    expect(await run(topicQuery, TOPIC_WITH_PAGE_ID, NL)).toMatchObject({
      slug: 'techniek',
    });
  });

  it('resolves a topic with no archive page to null', async () => {
    expect(await run(topicQuery, TOPIC_WITHOUT_PAGE_ID, EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a topic whose only page is in another language to null', async () => {
    expect(await run(topicQuery, TOPIC_OTHER_LANGUAGE_ID, EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves an inline topic link to its page slug in the reader language', async () => {
    expect(await run(linkQuery, TOPIC_LINK_ID, EN)).toMatchObject({
      internalReference: { slug: MOCK_TOPIC_SLUG },
    });
    expect(await run(linkQuery, TOPIC_LINK_ID, NL)).toMatchObject({
      internalReference: { slug: 'techniek' },
    });
  });

  it('resolves an inline topic link whose only page is in another language to null', async () => {
    expect(
      await run(linkQuery, OTHER_LANGUAGE_TOPIC_LINK_ID, EN),
    ).toMatchObject({ internalReference: { slug: null } });
  });
});
