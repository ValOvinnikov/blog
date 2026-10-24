import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockTestimonialItem } from '@web/testing/modules/testimonial/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TestimonialModuleView } from './testimonial-module-view';

const testimonials = [
  mockTestimonialItem({
    id: 'testimonial-1',
    name: 'Jordan Reyes',
    role: 'VP Engineering, Acme Co.',
    link: {
      label: 'Read the case study',
      href: '/case-studies/acme',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  }),
  mockTestimonialItem({
    id: 'testimonial-2',
    name: 'Priya Nair',
    role: 'Head of Product, Nimbus',
  }),
  mockTestimonialItem({
    id: 'testimonial-3',
    name: 'Marco Duarte',
    role: 'Founder, Lighthouse Studio',
  }),
];

const moreTestimonials = [
  mockTestimonialItem({ id: 'testimonial-4', name: 'Sana Ito' }),
  mockTestimonialItem({ id: 'testimonial-5', name: 'Wale Adebayo' }),
  mockTestimonialItem({ id: 'testimonial-6', name: 'Elin Kask' }),
  mockTestimonialItem({ id: 'testimonial-7', name: 'Tomas Berg' }),
];

const meta = {
  title: 'Modules/TestimonialModule',
  component: TestimonialModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
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
    headingBlock: mockHeadingBlock({ heading: 'What our customers say' }),
    testimonials,
    ctaButtons: [],
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

export const WithImages: TStory = {
  args: {
    testimonials: testimonials.map((item) => ({
      ...item,
      image: mockSanityImage(),
    })),
  },
};

export const Spotlight: TStory = {
  args: { testimonials: [testimonials[0]!] },
};

export const SpotlightCenterAligned: TStory = {
  args: {
    testimonials: [testimonials[0]!],
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    ctaButtons: MOCK_CTA_ACTIONS,
  },
};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const CarouselFitsCenter: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    testimonials: testimonials.slice(0, 2),
  },
};

export const WithActions: TStory = {
  args: { ctaButtons: MOCK_CTA_ACTIONS },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const FiveTestimonials: TStory = {
  args: {
    testimonials: [...testimonials, ...moreTestimonials.slice(0, 2)],
  },
};

export const SevenTestimonialsLastCardCentred: TStory = {
  args: {
    testimonials: [...testimonials, ...moreTestimonials],
  },
};

export const TabletTwoPerRow: TStory = {
  globals: { viewport: 'tablet' },
  args: { testimonials: SevenTestimonialsLastCardCentred.args?.testimonials },
};

export const TabletCarouselTwoPerView: TStory = {
  globals: { viewport: 'tablet' },
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    testimonials: SevenTestimonialsLastCardCentred.args?.testimonials,
  },
};
