import { HEADING_LEVELS } from '@blog/ui/lib/react';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TaxonomyCard } from './taxonomy-card';

const meta = {
  title: 'Molecules/TaxonomyCard',
  component: TaxonomyCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    headingLevel: {
      control: 'select',
      options: HEADING_LEVELS,
    },
  },
  args: {
    title: 'Engineering',
    href: '/topics/engineering',
    headingLevel: 2,
    postCountLabel: '12 posts',
  },
} satisfies Meta<typeof TaxonomyCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithDescription: TStory = {
  args: {
    description:
      'Posts about building things — architecture, tooling, and the craft of software.',
  },
};

export const WithoutDescription: TStory = {
  args: {
    title: 'react',
    href: '/tags/react',
    postCountLabel: '1 post',
  },
};

export const WithTwoPosts: TStory = {
  args: {
    description:
      'Posts about building things — architecture, tooling, and the craft of software.',
  },
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts in ${args.title}`}
        posts={[
          {
            id: '1',
            title: 'Refactoring the build pipeline',
            href: '/posts/refactoring-the-build-pipeline',
          },
          {
            id: '2',
            title: 'Why we moved to a monorepo',
            href: '/posts/why-we-moved-to-a-monorepo',
          },
        ]}
      />
    </TaxonomyCard>
  ),
};

export const WithOnePost: TStory = {
  args: {
    title: 'react',
    href: '/tags/react',
    postCountLabel: '1 post',
  },
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts tagged ${args.title}`}
        posts={[
          {
            id: '1',
            title: 'Server Components in practice',
            href: '/posts/server-components-in-practice',
          },
        ]}
      />
    </TaxonomyCard>
  ),
};

export const WithNoPosts: TStory = {
  args: {
    description:
      'Posts about building things — architecture, tooling, and the craft of software.',
  },
  render: (args) => (
    <TaxonomyCard {...args}>
      <TaxonomyCard.Posts
        ariaLabel={`Latest posts in ${args.title}`}
        posts={[]}
      />
    </TaxonomyCard>
  ),
};

export const Grid: TStory = {
  render: () => (
    <PostGrid>
      <TaxonomyCard
        title="Engineering"
        href="/topics/engineering"
        headingLevel={2}
        description="Posts about building things — architecture, tooling, and the craft of software."
        postCountLabel="12 posts"
      >
        <TaxonomyCard.Posts
          ariaLabel="Latest posts in Engineering"
          posts={[
            {
              id: '1',
              title: 'Refactoring the build pipeline',
              href: '/posts/refactoring-the-build-pipeline',
            },
            {
              id: '2',
              title: 'Why we moved to a monorepo',
              href: '/posts/why-we-moved-to-a-monorepo',
            },
          ]}
        />
      </TaxonomyCard>
      <TaxonomyCard
        title="Design"
        href="/topics/design"
        headingLevel={2}
        description="Visual and interaction design notes."
        postCountLabel="3 posts"
      >
        <TaxonomyCard.Posts
          ariaLabel="Latest posts in Design"
          posts={[
            {
              id: '1',
              title: 'A design system for the blog',
              href: '/posts/a-design-system-for-the-blog',
            },
          ]}
        />
      </TaxonomyCard>
      <TaxonomyCard
        title="react"
        href="/tags/react"
        headingLevel={2}
        postCountLabel="1 post"
      />
    </PostGrid>
  ),
};
