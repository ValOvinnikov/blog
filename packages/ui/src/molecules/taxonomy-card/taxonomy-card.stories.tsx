import { PostGrid } from '@blog/ui/organisms/post-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TaxonomyCard } from './taxonomy-card';

const meta = {
  title: 'Molecules/TaxonomyCard',
  component: TaxonomyCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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

export const Grid: TStory = {
  render: () => (
    <PostGrid>
      <TaxonomyCard
        title="Engineering"
        href="/topics/engineering"
        headingLevel={2}
        description="Posts about building things — architecture, tooling, and the craft of software."
        postCountLabel="12 posts"
      />
      <TaxonomyCard
        title="Design"
        href="/topics/design"
        headingLevel={2}
        description="Visual and interaction design notes."
        postCountLabel="3 posts"
      />
      <TaxonomyCard
        title="react"
        href="/tags/react"
        headingLevel={2}
        postCountLabel="1 post"
      />
    </PostGrid>
  ),
};
