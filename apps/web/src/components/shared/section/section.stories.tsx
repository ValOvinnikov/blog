import { BRAND_VARIANT, SPACING_SCALE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Section } from './section';

const meta = {
  title: 'Components/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    titleId: 'section-story-title',
    layout: {
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
    },
    children: (
      <>
        <h2 id="section-story-title">Section heading</h2>
        <p>
          Constrained inner content on a full-bleed background — the outer
          `&lt;section&gt;` tiles edge-to-edge with no gap collapse when
          stacked.
        </p>
      </>
    ),
  },
} satisfies Meta<typeof Section>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Primary: TStory = {
  args: { brandVariant: BRAND_VARIANT.PRIMARY },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const BrandPrimary: TStory = {
  args: { brandVariant: BRAND_VARIANT.BRAND_PRIMARY },
};

export const WithDividerAndLargeSpacing: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    layout: {
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.XL,
      dividerTop: true,
      dividerBottom: true,
    },
  },
};
