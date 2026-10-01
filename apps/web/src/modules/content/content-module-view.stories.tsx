import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  fullBleedImageDemo,
  richTextDemo,
} from '@web/testing/shared/portable-text/fixtures';

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

export const FullBleedImage: TStory = {
  args: { body: fullBleedImageDemo },
};

export const CentredInWideContainer: TStory = {
  args: {
    layout: {
      containerWidth: CONTAINER_WIDTH.WIDE,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      dividerTop: false,
      dividerBottom: false,
    },
  },
};

export const CentredInFullContainer: TStory = {
  args: {
    layout: {
      containerWidth: CONTAINER_WIDTH.FULL,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      dividerTop: false,
      dividerBottom: false,
    },
  },
};
