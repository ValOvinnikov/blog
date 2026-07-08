import type { Meta, StoryObj } from '@storybook/react';

import { PostCard } from '../../molecules/post-card';
import { PostGrid } from '../post-grid';
import { ContentSection } from './content-section';

const meta: Meta<typeof ContentSection> = {
  title: 'Organisms/ContentSection',
  component: ContentSection,
  tags: ['autodocs'],
  args: {
    title: 'Latest',
    titleId: 'latest-posts',
  },
};
export default meta;

type TStory = StoryObj<typeof ContentSection>;

export const WithPostGrid: TStory = {
  render: (args) => (
    <ContentSection {...args}>
      <PostGrid>
        <PostCard
          excerpt="A compact post card inside a reusable labeled section."
          publishedAt="2024-06-01T00:00:00Z"
          formattedDate="June 1, 2024"
        >
          <PostCard.Title>
            <a href="/posts/design-system">Building a Design System</a>
          </PostCard.Title>
        </PostCard>
      </PostGrid>
    </ContentSection>
  ),
};
