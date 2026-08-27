import type { ISanityImage } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeBlogPostPageView } from '@web/testing/pages/blog-post-page/fixtures';

import { BlogPostPageView } from './blog-post-page-view';

const meta = {
  title: 'Pages/BlogPostPageView',
  component: BlogPostPageView,
  tags: ['autodocs'],
  args: makeBlogPostPageView(),
} satisfies Meta<typeof BlogPostPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoNewsletter: TStory = {
  args: {
    isNewsletterEnabled: false,
  },
};

export const WithRelatedReading: TStory = {
  args: {
    relatedPostItems: [
      {
        id: 'related-1',
        href: '/blog/a-related-post',
        title: 'A Related Post',
        excerpt: 'A related excerpt.',
        publishedAt: '2026-01-10T00:00:00.000Z',
        formattedDate: 'January 10, 2026',
        readingTime: '3 min',
        topic: { title: 'Design' },
      },
    ],
  },
};

const heroImageSanity: ISanityImage = {
  assetId: 'image-abc123-1600x1200-jpg',
  alt: 'A scenic mountain range',
  hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
};

export const WithHeroImage: TStory = {
  args: { heroImageSanity },
};

export const WithContentsRail: TStory = {
  args: {
    hasContentsRail: true,
    headings: [
      { id: 'getting-started', text: 'Getting started', level: 2, key: 'h1' },
      { id: 'configuration', text: 'Configuration', level: 2, key: 'h2' },
      { id: 'deployment', text: 'Deployment', level: 2, key: 'h3' },
    ],
  },
};
