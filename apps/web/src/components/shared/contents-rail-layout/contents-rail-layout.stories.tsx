import { Prose } from '@blog/ui/components/atoms/prose';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PortableText } from '@web/components/shared/portable-text';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { MOCK_RICH_TEXT_DEMO } from '@web/testing/shared/portable-text/fixtures';

import { ContentsRailLayout } from './contents-rail-layout';

const meta = {
  title: 'Components/ContentsRailLayout',
  component: ContentsRailLayout,
  parameters: { layout: 'fullscreen' },
  render: ({ body }) => (
    <ContentsRailLayout body={body}>
      <Prose>
        <PortableText value={body} />
      </Prose>
    </ContentsRailLayout>
  ),
  args: { body: MOCK_CONTENTS_RAIL_BODY, children: null },
} satisfies Meta<typeof ContentsRailLayout>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithRail: TStory = {};

export const WithoutRail: TStory = {
  args: { body: MOCK_RICH_TEXT_DEMO },
};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};
