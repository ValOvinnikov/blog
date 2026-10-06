import { LINK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { inlineLinkFragment } from '@blog/service/shared/fragments/link/inline-link';
import { tagFragment } from '@blog/service/shared/fragments/tag/tag';
import { topicFragment } from '@blog/service/shared/fragments/topic/topic';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

const localized = [{ _key: 'en', language: 'en', value: 'Title' }];

const dataset = [
  { _id: 'tag-with-page', _type: 'blog_tag', title: localized },
  { _id: 'tag-without-page', _type: 'blog_tag', title: localized },
  { _id: 'topic-with-page', _type: 'blog_topic', title: localized },
  { _id: 'topic-without-page', _type: 'blog_topic', title: localized },
  {
    _id: 'page-tag',
    _type: 'page_tag',
    slug: { current: 'typescript' },
    tag: { _type: 'reference', _ref: 'tag-with-page' },
  },
  {
    _id: 'page-topic',
    _type: 'page_topic',
    slug: { current: 'engineering' },
    topic: { _type: 'reference', _ref: 'topic-with-page' },
  },
  {
    _id: 'link-to-topic',
    _type: 'inlineLink',
    label: 'Topic',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: { _type: 'reference', _ref: 'topic-with-page' },
  },
];

const params = { locale: 'en', defaultLocale: 'en' };

async function run(query: string, id: string) {
  return evaluateGroqExpression(
    `*[_id == "${id}"][0]${query}`,
    dataset,
    null,
    params,
  );
}

const tagQuery = q.star.filterByType('blog_tag').slice(0).project(tagFragment);
const topicQuery = q.star
  .filterByType('blog_topic')
  .slice(0)
  .project(topicFragment);
const linkQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment);

function projection(query: string) {
  return query.slice(query.indexOf('{'));
}

describe('archive page slug', () => {
  it('resolves a tag to the slug of the page referencing it', async () => {
    expect(
      await run(projection(tagQuery.query), 'tag-with-page'),
    ).toMatchObject({ slug: 'typescript' });
  });

  it('resolves a tag with no archive page to null', async () => {
    expect(
      await run(projection(tagQuery.query), 'tag-without-page'),
    ).toMatchObject({ slug: null });
  });

  it('resolves a topic to the slug of the page referencing it', async () => {
    expect(
      await run(projection(topicQuery.query), 'topic-with-page'),
    ).toMatchObject({ slug: 'engineering' });
  });

  it('resolves a topic with no archive page to null', async () => {
    expect(
      await run(projection(topicQuery.query), 'topic-without-page'),
    ).toMatchObject({ slug: null });
  });

  it('resolves an inline link to a topic to the slug of its archive page', async () => {
    expect(
      await run(projection(linkQuery.query), 'link-to-topic'),
    ).toMatchObject({ internalReference: { slug: 'engineering' } });
  });
});
