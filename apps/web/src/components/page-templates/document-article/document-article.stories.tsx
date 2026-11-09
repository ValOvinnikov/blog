import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { MOCK_RICH_TEXT_DEMO } from '@web/testing/shared/portable-text/fixtures';

import { DocumentArticle } from './document-article';

const meta = {
  title: 'Page Templates/DocumentArticle',
  component: DocumentArticle,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Cookie statement', body: MOCK_CONTENTS_RAIL_BODY },
} satisfies Meta<typeof DocumentArticle>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithRail: TStory = {};

export const WithoutRail: TStory = {
  args: { body: MOCK_RICH_TEXT_DEMO },
};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};
