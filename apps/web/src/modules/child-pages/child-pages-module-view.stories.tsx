import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  makeChildPageCard,
  makeChildPagesModule,
} from '@web/testing/modules/child-pages/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { ChildPagesModuleView } from './child-pages-module-view';

const pages = [
  makeChildPageCard(),
  makeChildPageCard({
    id: 'pricing',
    title: 'Pricing',
    summary: 'Plans for every size of team.',
    path: 'modules/pricing',
  }),
  makeChildPageCard({
    id: 'testimonials',
    title: 'Testimonials',
    summary: undefined,
    path: 'modules/testimonials',
  }),
];

const meta = {
  title: 'Modules/ChildPagesModule',
  component: ChildPagesModuleView,
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
  },
  args: {
    ...makeChildPagesModule({ pages }),
    titleId: 'child-pages-title',
    dataTestId: 'child-pages-module-child-pages-1',
  },
} satisfies Meta<typeof ChildPagesModuleView>;

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
