import { SOCIAL_PLATFORMS } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { onDarkDecorators } from '@web/testing/shared/on-dark/decorators';

import { SocialLinks } from './social-links';

const profiles = [
  {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: {
      label: 'GitHub',
      href: 'https://github.com/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
  {
    platform: SOCIAL_PLATFORMS.LINKEDIN,
    link: {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
];

const meta = {
  title: 'Components/SocialLinks',
  component: SocialLinks,
  tags: ['autodocs'],
  args: { profiles, variant: 'outlined' },
} satisfies Meta<typeof SocialLinks>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const OnDark: TStory = {
  args: { isOnDark: true },
  decorators: onDarkDecorators,
};
