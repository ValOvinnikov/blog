import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeTestimonialCardItem } from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TestimonialModuleView } from './testimonial-module-view';

const testimonials = [
  makeTestimonialCardItem({
    id: 'testimonial-1',
    name: 'Ada Lovelace',
    role: 'Head of Engineering, Acme',
    quote:
      'The migration shipped two weeks early and nobody noticed a thing — that is exactly the point.',
    link: {
      label: 'Read the case study',
      href: '/case-studies/ada',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  }),
  makeTestimonialCardItem({
    id: 'testimonial-2',
    name: 'Grace Hopper',
    role: 'CTO, Naval Systems',
    quote: 'Every debugging session got shorter once we adopted this stack.',
  }),
  makeTestimonialCardItem({
    id: 'testimonial-3',
    name: 'Margaret Hamilton',
    role: 'Principal Engineer, Draper Labs',
    quote: 'Our on-call rotation stopped dreading deploy day.',
  }),
];

const meta = {
  title: 'Modules/TestimonialModule',
  component: TestimonialModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
    cardAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'What our clients say' }),
    testimonials,
    ctaButtons: [],
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: undefined,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: undefined,
    titleId: 'testimonial-title',
    dataTestId: 'testimonial-module-testimonial-1',
  },
} satisfies Meta<typeof TestimonialModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Grid: TStory = {};

export const Spotlight: TStory = {
  args: { testimonials: [testimonials[0]!] },
};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const PhotosOff: TStory = {
  args: { showImages: false },
};

export const FiveTestimonials: TStory = {
  args: {
    testimonials: [
      ...testimonials,
      makeTestimonialCardItem({
        id: 'testimonial-4',
        name: 'Katherine Johnson',
      }),
      makeTestimonialCardItem({ id: 'testimonial-5', name: 'Dorothy Vaughan' }),
    ],
  },
};
