import { Size, routes } from '@blog/config';
import type { TPostCard } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Icon } from '@blog/ui/atoms/icon';
import { ActionList } from '@blog/ui/molecules/action-list';
import { ShareLink } from '@blog/ui/molecules/share-link';
import { Pagination } from '@blog/ui/organisms/pagination';
import {
  type IPostCardData,
  PostsSection,
} from '@blog/ui/organisms/posts-section';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { makeAuthor } from '@web/testing/shared/author/fixtures';
import {
  makePostCard,
  makePostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { toSocialIconName } from '@web/utils/to-social-icon-name';

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

const author = makeAuthor({
  name: 'Jane Doe',
  role: 'Senior Engineer',
  socialLinks: [
    { platform: 'X', url: 'https://x.com/example' },
    { platform: 'GitHub', url: 'https://github.com/example' },
  ],
});

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

/** `/blog` — topic chips, pagination, and a page-builder module below the shell. */
export const BlogIndex: TStory = {
  args: {
    supportingText: 'Essays and notes on building this site.',
    topicChips: <TopicChipList topics={topics} />,
    pagination: (
      <Pagination
        currentPage={1}
        totalPages={4}
        createHref={(page) => `/blog/page/${page}`}
        ariaLabel="Blog pagination"
        previousLabel="Previous"
        nextLabel="Next"
        linkAs={SmartLink}
      />
    ),
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        Page-builder modules render here
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

/** `/author/[slug]` — role/avatar `introHeader`, bio `supportingText`, `socialLinks`. */
export const Author: TStory = {
  args: {
    heading: author.name,
    introHeader: (
      <div className="flex flex-col gap-3">
        {author.role && <Eyebrow>{author.role}</Eyebrow>}
        <Avatar
          name={author.name}
          alt={author.name}
          src={author.imageUrl}
          size={Size.LG}
        />
      </div>
    ),
    supportingText: blockTextToPlain(author.bio),
    socialLinks: (
      <ActionList className="max-w-measure">
        {author.socialLinks.map((link) => {
          const iconName = toSocialIconName(link.platform);

          return (
            <ShareLink
              key={link.url}
              href={link.url}
              label={link.platform}
              icon={
                iconName ? <Icon name={iconName} size={Size.SM} /> : undefined
              }
              as={SmartLink}
            />
          );
        })}
      </ActionList>
    ),
    pagination: (
      <Pagination
        currentPage={1}
        totalPages={3}
        createHref={(page) => `/author/jane-doe/page/${page}`}
        ariaLabel="Author pagination"
        previousLabel="Previous"
        nextLabel="Next"
        linkAs={SmartLink}
      />
    ),
  },
};

/** `/tag/[slug]` — supporting text and pagination only, no chips or intro header. */
export const Tag: TStory = {
  args: {
    heading: 'TypeScript',
    supportingText: 'Posts about TypeScript.',
    pagination: (
      <Pagination
        currentPage={1}
        totalPages={2}
        createHref={(page) => `/tag/typescript/page/${page}`}
        ariaLabel="Tag pagination"
        previousLabel="Previous"
        nextLabel="Next"
        linkAs={SmartLink}
      />
    ),
  },
};
