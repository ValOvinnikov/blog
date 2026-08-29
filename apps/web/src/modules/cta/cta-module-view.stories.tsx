import { BRAND_VARIANT, CTA_IMAGE_SIDE, CTA_VARIANT } from '@blog/config';
import { getSanityImageBaseUrl } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  ctaActionsDemo,
  ctaContentDemo,
} from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { CtaModuleView } from './cta-module-view';

const meta = {
  title: 'Modules/CtaModule',
  component: CtaModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'cta-1',
    variant: CTA_VARIANT.CALLOUT,
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: 'Newsletter',
    sectionHeader: {
      heading: 'Never miss a post',
      supportingText:
        'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
      align: undefined,
    },
    content: undefined,
    image: undefined,
    imageSide: undefined,
    mobileMediaOrder: undefined,
    actions: ctaActionsDemo,
    footnote: undefined,
    layout: undefined,
    baseUrl: getSanityImageBaseUrl(),
  },
} satisfies Meta<typeof CtaModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Callout: TStory = {};

export const WithoutActions: TStory = {
  args: { actions: [] },
};

export const WithContent: TStory = {
  args: { content: ctaContentDemo },
};

export const WithImage: TStory = {
  args: { image: makeSanityImage() },
};

export const Split: TStory = {
  args: {
    variant: CTA_VARIANT.SPLIT,
    image: makeSanityImage(),
    imageSide: CTA_IMAGE_SIDE.RIGHT,
  },
};

export const Banner: TStory = {
  args: {
    variant: CTA_VARIANT.BANNER,
    brandVariant: BRAND_VARIANT.SECONDARY,
    image: makeSanityImage(),
  },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
