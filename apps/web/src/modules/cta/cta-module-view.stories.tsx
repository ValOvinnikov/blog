import {
  BRAND_VARIANT,
  CTA_IMAGE_SIDE,
  CTA_MOBILE_MEDIA_ORDER,
  CTA_VARIANT,
} from '@blog/config';
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
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(CTA_VARIANT),
    },
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    bandTone: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    imageSide: {
      control: 'select',
      options: Object.values(CTA_IMAGE_SIDE),
    },
    mobileMediaOrder: {
      control: 'select',
      options: Object.values(CTA_MOBILE_MEDIA_ORDER),
    },
  },
  args: {
    id: 'cta-1',
    variant: CTA_VARIANT.CALLOUT,
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    bandTone: BRAND_VARIANT.PRIMARY,
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
