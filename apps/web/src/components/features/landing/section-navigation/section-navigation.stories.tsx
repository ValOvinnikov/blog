import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';
import { userEvent, within } from 'storybook/test';

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

export const NestedSection: TStory = {
  args: {
    sectionNavigation: makeLandingSectionNavigation({
      title: 'Profile hero layouts',
      root: {
        title: 'Profile hero',
        path: 'modules/profile-hero',
        isCurrent: false,
      },
      pages: [
        {
          title: 'Split left',
          path: 'modules/profile-hero/split-left',
          isCurrent: true,
        },
        {
          title: 'Centred',
          path: 'modules/profile-hero/centred',
          isCurrent: false,
        },
      ],
      parentSection: { title: 'Modules', path: 'modules' },
    }),
  },
};

export const NestedSectionMobileOpen: TStory = {
  ...NestedSection,
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Profile hero layouts/ }),
    );
  },
};
