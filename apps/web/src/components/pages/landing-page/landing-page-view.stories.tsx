import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeLandingPageView } from '@web/testing/pages/landing-page/fixtures';

import { LandingPageView } from './landing-page-view';

const meta = {
  title: 'Pages/LandingPageView',
  component: LandingPageView,
  tags: ['autodocs'],
  args: makeLandingPageView(),
} satisfies Meta<typeof LandingPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoBreadcrumbSchema: TStory = {
  args: {
    breadcrumbListSchema: undefined,
  },
};
