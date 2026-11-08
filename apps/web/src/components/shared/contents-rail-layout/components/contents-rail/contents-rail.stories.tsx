import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CONTENTS_HEADINGS } from '@web/testing/shared/contents-rail/fixtures';

import { ContentsRail } from './contents-rail';

const meta = {
  title: 'Components/ContentsRail',
  component: ContentsRail,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { headings: MOCK_CONTENTS_HEADINGS },
} satisfies Meta<typeof ContentsRail>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};
