import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  makeSectionPageCard,
  makeSectionPagesModule,
} from '@web/testing/modules/section-pages/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

const pages = [
  makeSectionPageCard(),
  makeSectionPageCard({
    id: 'pricing',
    title: 'Pricing',
    summary: 'Plans for every size of team.',
    path: 'modules/pricing',
  }),
  makeSectionPageCard({
    id: 'testimonials',
    title: 'Testimonials',
    summary: undefined,
    path: 'modules/testimonials',
  }),
];

const meta = {
  title: 'Modules/SectionPagesModule',
  component: SectionPagesModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    ...makeSectionPagesModule({ pages }),
    titleId: 'section-pages-title',
    dataTestId: 'section-pages-module-section-pages-1',
  },
} satisfies Meta<typeof SectionPagesModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithImages: TStory = {
  args: {
    pages: pages.map((page) => ({ ...page, image: makeSanityImage() })),
  },
};

export const WithoutHeading: TStory = {
  args: { headingBlock: undefined },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const TitleOnly: TStory = {
  args: {
    pages: pages.map((page) => ({ ...page, summary: undefined })),
  },
};

export const MixedTitleOnlyAndSummary: TStory = {
  args: {
    pages: [
      ...pages,
      makeSectionPageCard({
        id: 'contact',
        title: 'Contact',
        summary: undefined,
        path: 'modules/contact',
      }),
      makeSectionPageCard({
        id: 'careers',
        title: 'Careers',
        summary: undefined,
        path: 'modules/careers',
      }),
      makeSectionPageCard({
        id: 'press',
        title: 'Press',
        summary: undefined,
        path: 'modules/press',
      }),
    ],
  },
};
