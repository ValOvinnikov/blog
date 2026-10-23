import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { onDarkDecorators } from '@web/testing/shared/on-dark/decorators';
import {
  MOCK_GITHUB_PROFILE,
  MOCK_LINKEDIN_PROFILE,
} from '@web/testing/shared/social-profile/fixtures';

import { SocialLinks } from './social-links';

const profiles = [MOCK_GITHUB_PROFILE, MOCK_LINKEDIN_PROFILE];

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
