import { routes } from '@blog/config';
import type { TPostCard } from '@blog/service';
import { Pagination } from '@blog/ui/organisms/pagination';
import {
  type IPostCardData,
  PostsSection,
} from '@blog/ui/organisms/posts-section';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import {
  makePostCard,
  makePostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { BlogPageTemplate } from './blog-page-template';

const toCardData = (post: TPostCard): IPostCardData => ({
  id: post.id,
  href: routes.post(post.slug),
  title: post.title,
  excerpt: post.excerpt,
  publishedAt: post.publishedAt,
  formattedDate: new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  readingTime: `${post.readingTimeMinutes} min`,
  topic: { title: post.topic.title },
});

const posts = [
  makePostCard({
    id: 'post-1',
    title: 'How we ship reviews faster',
    slug: 'how-we-ship-reviews-faster',
    publishedAt: '2026-03-04T00:00:00.000Z',
    topic: makePostCardTopic({ id: 'topic-1', title: 'Engineering' }),
  }),
  makePostCard({
    id: 'post-2',
    title: 'A tour of the new editor',
    slug: 'a-tour-of-the-new-editor',
    publishedAt: '2026-02-18T00:00:00.000Z',
    topic: makePostCardTopic({ id: 'topic-2', title: 'Product' }),
  }),
  makePostCard({
    id: 'post-3',
    title: 'Notes from our first year',
    slug: 'notes-from-our-first-year',
    publishedAt: '2026-01-09T00:00:00.000Z',
    topic: makePostCardTopic({ id: 'topic-3', title: 'News' }),
  }),
].map(toCardData);

const topics = [
  makeTopicWithPostCount({
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
  }),
  makeTopicWithPostCount({ id: 'topic-2', title: 'Product', slug: 'product' }),
  makeTopicWithPostCount({ id: 'topic-3', title: 'News', slug: 'news' }),
];

const meta = {
  title: 'Page Templates/BlogPageTemplate',
  component: BlogPageTemplate,
  tags: ['autodocs'],
  args: {
    heading: 'Blog',
    posts: (
      <PostsSection
        posts={posts}
        title="Latest posts"
        titleId="blog-posts-title"
        linkAs={SmartLink}
      />
    ),
  },
} satisfies Meta<typeof BlogPageTemplate>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** The bare shell — only `heading` and `posts`, no optional slots. */
export const Minimal: TStory = {};

/**
 * `/blog` — the archive itself renders through `PostListModule` in the
 * `modules` position, not the `posts`/`pagination` slots, so this story
 * leaves both unset.
 */
export const BlogIndex: TStory = {
  args: {
    posts: undefined,
    supportingText: 'Essays and notes on building this site.',
    topicChips: <TopicChipList topics={topics} />,
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        The post-list archive and any page-builder modules render here
      </div>
    ),
  },
};

/** `/topics/[slug]` — topic chips highlighting the active topic, no modules. */
export const Topic: TStory = {
  args: {
    heading: 'Engineering',
    supportingText: 'Posts about building things.',
    topicChips: <TopicChipList topics={topics} activeSlug="engineering" />,
    pagination: (
      <Pagination
        currentPage={1}
        totalPages={2}
        createHref={(page) => `/topics/engineering/page/${page}`}
        ariaLabel="Topic pagination"
        previousLabel="Previous"
        nextLabel="Next"
        linkAs={SmartLink}
      />
    ),
  },
};

/** `/tags/[slug]` — supporting text and pagination only, no chips or intro header. */
export const Tag: TStory = {
  args: {
    heading: 'TypeScript',
    supportingText: 'Posts about TypeScript.',
    pagination: (
      <Pagination
        currentPage={1}
        totalPages={2}
        createHref={(page) => `/tags/typescript/page/${page}`}
        ariaLabel="Tag pagination"
        previousLabel="Previous"
        nextLabel="Next"
        linkAs={SmartLink}
      />
    ),
  },
};
