import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  SPACING_SCALE,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Section } from '@web/components/shared/section';
import {
  MOCK_CTA_ACTIONS,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { CtaModuleView } from './cta-module-view';

const CALLOUT_MODULE = mockCtaModuleData({
  variant: CTA_VARIANT.CALLOUT,
  brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
  bandTone: BRAND_VARIANT.PRIMARY,
  eyebrow: 'Newsletter',
  headingBlock: mockHeadingBlock({
    heading: 'Never miss a post',
    supportingText:
      'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
  }),
  ctaButtons: MOCK_CTA_ACTIONS,
});

const BANNER_MODULE = mockCtaModuleData({
  ...CALLOUT_MODULE,
  variant: CTA_VARIANT.BANNER,
  brandVariant: BRAND_VARIANT.SECONDARY,
  bandTone: BRAND_VARIANT.SECONDARY,
  image: mockSanityImage(),
  contentPosition: CONTENT_ALIGNMENT.CENTER,
  contentAlignment: CONTENT_ALIGNMENT.CENTER,
});

const meta = {
  title: 'Modules/CtaModule',
  component: CtaModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'cta-1',
    module: CALLOUT_MODULE,
  },
} satisfies Meta<typeof CtaModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Callout: TStory = {
  args: {
    module: { ...CALLOUT_MODULE, contentAlignment: CONTENT_ALIGNMENT.RIGHT },
  },
};

export const Split: TStory = {
  args: {
    module: {
      ...CALLOUT_MODULE,
      variant: CTA_VARIANT.SPLIT,
      image: mockSanityImage(),
      contentPosition: CONTENT_ALIGNMENT.RIGHT,
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    },
  },
};

export const Banner: TStory = {
  args: {
    module: { ...BANNER_MODULE, bandTone: BRAND_VARIANT.PRIMARY },
  },
};

export const BannerBetweenSecondarySectionsSpacingNone: TStory = {
  args: {
    module: {
      ...BANNER_MODULE,
      layout: {
        spacingTop: SPACING_SCALE.NONE,
        spacingBottom: SPACING_SCALE.NONE,
      },
    },
  },
  render: (args) => (
    <>
      <Section brandVariant={BRAND_VARIANT.SECONDARY}>
        <p>Section above the banner</p>
      </Section>
      <CtaModuleView {...args} />
      <Section brandVariant={BRAND_VARIANT.SECONDARY}>
        <p>Section below the banner</p>
      </Section>
    </>
  ),
};

export const BannerBetweenSecondarySectionsSpacingXl: TStory = {
  args: {
    module: {
      ...BANNER_MODULE,
      layout: {
        spacingTop: SPACING_SCALE.XL,
        spacingBottom: SPACING_SCALE.XL,
      },
    },
  },
  render: BannerBetweenSecondarySectionsSpacingNone.render,
};
