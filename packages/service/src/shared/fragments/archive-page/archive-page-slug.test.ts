import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { inlineLinkFragment } from '@blog/service/shared/fragments/link/inline-link';
import { tagFragment } from '@blog/service/shared/fragments/tag/tag';
import { topicFragment } from '@blog/service/shared/fragments/topic/topic';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

const { EN, NL } = LOCALE_ISO_CODES;

const localized = [{ _key: 'en', language: EN, value: 'Title' }];

const dataset = [
  { _id: 'tag-with-page', _type: 'blog_tag', title: localized },
  { _id: 'tag-without-page', _type: 'blog_tag', title: localized },
  { _id: 'tag-other-language', _type: 'blog_tag', title: localized },
  { _id: 'topic-with-page', _type: 'blog_topic', title: localized },
  { _id: 'topic-without-page', _type: 'blog_topic', title: localized },
  { _id: 'topic-other-language', _type: 'blog_topic', title: localized },
  {
    _id: 'page-tag-en',
    _type: 'page_tag',
    slug: { current: 'typescript' },
    tag: { _type: 'reference', _ref: 'tag-with-page' },
    language: EN,
  },
  {
    _id: 'page-tag-nl',
    _type: 'page_tag',
    slug: { current: 'typescript-nl' },
    tag: { _type: 'reference', _ref: 'tag-with-page' },
    language: NL,
  },
  {
    _id: 'page-tag-nl-only',
    _type: 'page_tag',
    slug: { current: 'alleen-nl' },
    tag: { _type: 'reference', _ref: 'tag-other-language' },
    language: NL,
  },
  {
    _id: 'page-topic-en',
    _type: 'page_topic',
    slug: { current: 'engineering' },
    topic: { _type: 'reference', _ref: 'topic-with-page' },
    language: EN,
  },
  {
    _id: 'page-topic-nl',
    _type: 'page_topic',
    slug: { current: 'techniek' },
    topic: { _type: 'reference', _ref: 'topic-with-page' },
    language: NL,
  },
  {
    _id: 'page-topic-nl-only',
    _type: 'page_topic',
    slug: { current: 'alleen-nl' },
    topic: { _type: 'reference', _ref: 'topic-other-language' },
    language: NL,
  },
  {
    _id: 'link-to-topic',
    _type: 'inlineLink',
    label: 'Topic',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: { _type: 'reference', _ref: 'topic-with-page' },
  },
  {
    _id: 'link-to-topic-other-language',
    _type: 'inlineLink',
    label: 'Topic',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: { _type: 'reference', _ref: 'topic-other-language' },
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
    expect(await run(tagQuery, 'tag-with-page', EN)).toMatchObject({
      slug: 'typescript',
    });
    expect(await run(tagQuery, 'tag-with-page', NL)).toMatchObject({
      slug: 'typescript-nl',
    });
  });

  it('resolves a tag with no archive page to null', async () => {
    expect(await run(tagQuery, 'tag-without-page', EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a tag whose only page is in another language to null', async () => {
    expect(await run(tagQuery, 'tag-other-language', EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a topic to the slug of its page in the reader language', async () => {
    expect(await run(topicQuery, 'topic-with-page', EN)).toMatchObject({
      slug: 'engineering',
    });
    expect(await run(topicQuery, 'topic-with-page', NL)).toMatchObject({
      slug: 'techniek',
    });
  });

  it('resolves a topic with no archive page to null', async () => {
    expect(await run(topicQuery, 'topic-without-page', EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves a topic whose only page is in another language to null', async () => {
    expect(await run(topicQuery, 'topic-other-language', EN)).toMatchObject({
      slug: null,
    });
  });

  it('resolves an inline link to a topic to the slug of its page in the reader language', async () => {
    expect(await run(linkQuery, 'link-to-topic', EN)).toMatchObject({
      internalReference: { slug: 'engineering' },
    });
    expect(await run(linkQuery, 'link-to-topic', NL)).toMatchObject({
      internalReference: { slug: 'techniek' },
    });
  });

  it('resolves an inline link to a topic whose only page is in another language to null', async () => {
    expect(
      await run(linkQuery, 'link-to-topic-other-language', EN),
    ).toMatchObject({ internalReference: { slug: null } });
  });
});
