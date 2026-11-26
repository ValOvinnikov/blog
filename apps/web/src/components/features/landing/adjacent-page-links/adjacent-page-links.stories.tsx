import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockLandingAdjacentPages } from '@web/testing/pages/landing-page/fixtures';

import { AdjacentPageLinks } from './adjacent-page-links';

const meta = {
  title: 'Features/Landing/AdjacentPageLinks',
  component: AdjacentPageLinks,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { adjacentPages: mockLandingAdjacentPages() },
} satisfies Meta<typeof AdjacentPageLinks>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Both: TStory = {};

export const PreviousOnly: TStory = {
  args: { adjacentPages: mockLandingAdjacentPages({ next: undefined }) },
};

export const NextOnly: TStory = {
  args: { adjacentPages: mockLandingAdjacentPages({ previous: undefined }) },
};

export const LongTitles: TStory = {
  args: {
    adjacentPages: mockLandingAdjacentPages({
      previous: {
        title:
          'Connecting a custom domain and verifying its DNS records before launch',
        path: 'guides/custom-domain',
      },
      next: {
        title:
          'Inviting your team, assigning roles and handing over the newsletter',
        path: 'guides/team',
      },
    }),
  },
};

export const LongTitlesMobile: TStory = {
  ...LongTitles,
  globals: { viewport: 'mobile' },
};
