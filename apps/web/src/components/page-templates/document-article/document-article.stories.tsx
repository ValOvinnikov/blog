import { CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import {
  MOCK_RICH_TEXT_DEMO,
  MOCK_WIDE_TABLE_DEMO,
} from '@web/testing/shared/portable-text/fixtures';

import { DocumentArticle } from './document-article';

const meta = {
  title: 'Page Templates/DocumentArticle',
  component: DocumentArticle,
  parameters: { layout: 'fullscreen' },
  args: {
    headingBlock: {
      heading: 'Cookie statement',
      supportingText: 'Which cookies this site sets, and why.',
    },
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    body: MOCK_CONTENTS_RAIL_BODY,
  },
} satisfies Meta<typeof DocumentArticle>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithRail: TStory = {};

export const WithoutRail: TStory = {
  args: { body: MOCK_RICH_TEXT_DEMO },
};

export const WideTableWithRail: TStory = {
  args: { body: [...MOCK_CONTENTS_RAIL_BODY, ...MOCK_WIDE_TABLE_DEMO] },
};

export const WideTableWithoutRail: TStory = {
  args: { body: MOCK_WIDE_TABLE_DEMO },
};

export const CenterAlignedHeading: TStory = {
  args: { headingAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const WithoutHeadingBlock: TStory = {
  args: { headingBlock: undefined },
};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};
