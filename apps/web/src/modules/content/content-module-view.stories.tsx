import { BRAND_VARIANT, SPACING_SCALE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { ContentModuleView } from './content-module-view';

const meta = {
  title: 'Modules/ContentModuleView',
  component: ContentModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'content-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: richTextDemo,
    layout: undefined,
  },
} satisfies Meta<typeof ContentModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const BrandSecondary: TStory = {
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
