import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { onImageDecorators } from '@web/testing/shared/on-image/decorators';
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

export const OnImage: TStory = {
  decorators: onImageDecorators,
};
