import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FaqModuleView } from './faq-module-view';

const questions = [
  makeFaqQuestion({
    id: 'faq-1',
    question: 'Do you offer a free trial?',
  }),
  makeFaqQuestion({
    id: 'faq-2',
    question: 'Can I cancel my subscription at any time?',
  }),
  makeFaqQuestion({
    id: 'faq-3',
    question: 'Do you offer discounts for annual billing?',
  }),
];

const meta = {
  title: 'Modules/FaqModule',
  component: FaqModuleView,
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
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Frequently asked questions' }),
    questions,
    ctaButtons: [],
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'faq-title',
    dataTestId: 'faq-module-faq-1',
  },
} satisfies Meta<typeof FaqModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};
