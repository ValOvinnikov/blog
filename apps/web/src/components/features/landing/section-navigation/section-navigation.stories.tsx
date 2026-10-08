import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';

import { SectionNavigation } from './section-navigation';

const meta = {
  title: 'Features/Landing/SectionNavigation',
  component: SectionNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { sectionNavigation: makeLandingSectionNavigation() },
} satisfies Meta<typeof SectionNavigation>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};

export const CustomTitle: TStory = {
  args: {
    sectionNavigation: makeLandingSectionNavigation({ title: 'Guides' }),
  },
};
