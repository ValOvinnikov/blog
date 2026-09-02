import { BRAND_VARIANT, SPACING_SCALE } from '@blog/config';
import { getSanityImageBaseUrl } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { ContentModuleView } from './content-module-view';

const meta = {
  title: 'Modules/ContentModule',
  component: ContentModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
  },
  args: {
    id: 'content-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: richTextDemo,
    layout: undefined,
    baseUrl: getSanityImageBaseUrl(),
  },
  decorators: [
    (Story) => (
      <div className="py-section">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const WithDividerAndLargeSpacing: TStory = {
  args: {
    layout: {
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.XL,
      dividerTop: true,
      dividerBottom: true,
    },
  },
};
