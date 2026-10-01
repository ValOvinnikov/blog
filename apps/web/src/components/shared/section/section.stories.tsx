import { BRAND_VARIANT, SPACING_SCALE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Section } from './section';

const meta = {
  title: 'Components/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
  },
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

export const DefaultSpacing: TStory = {
  args: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const BrandPrimary: TStory = {
  args: { brandVariant: BRAND_VARIANT.BRAND_PRIMARY },
};

const SurfaceTokenDemo = () => (
  <>
    <h2 id="section-story-title">Section heading</h2>
    <p>
      The focused control and the top/bottom dividers read their colour from
      this section&apos;s surface tokens.
    </p>
    <button
      type="button"
      autoFocus={true}
      className="focus-visible:ring-brand-primary focus-visible:ring-offset-ambient focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      Focused control
    </button>
  </>
);

export const PrimarySurfaceTokens: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    layout: {
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      dividerTop: true,
      dividerBottom: true,
    },
    children: <SurfaceTokenDemo />,
  },
};

export const SecondarySurfaceTokens: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.SECONDARY,
    layout: {
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      dividerTop: true,
      dividerBottom: true,
    },
    children: <SurfaceTokenDemo />,
  },
};

export const BrandPrimarySurfaceTokens: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    layout: {
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      dividerTop: true,
      dividerBottom: true,
    },
    children: <SurfaceTokenDemo />,
  },
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
  decorators: [
    (Story) => (
      <div className="py-section">
        <Story />
      </div>
    ),
  ],
};
