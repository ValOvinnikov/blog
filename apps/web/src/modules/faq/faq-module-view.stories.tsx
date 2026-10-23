import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import {
  MOCK_FAQ_ANSWER_WITH_LIST_AND_LINK,
  mockFaqQuestion,
} from '@web/testing/modules/faq/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FaqModuleView } from './faq-module-view';

const questions = [
  mockFaqQuestion({
    id: 'faq-1',
    question: 'Do you offer a free trial?',
  }),
  mockFaqQuestion({
    id: 'faq-2',
    question: 'Can I cancel my subscription at any time?',
  }),
  mockFaqQuestion({
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
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockHeadingBlock({ heading: 'Frequently asked questions' }),
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
  args: { ctaButtons: MOCK_CTA_ACTIONS },
};

export const WithRichAnswer: TStory = {
  args: {
    questions: [
      mockFaqQuestion({
        id: 'faq-1',
        question: 'What does the free trial include?',
        answer: MOCK_FAQ_ANSWER_WITH_LIST_AND_LINK,
      }),
      ...questions.slice(1),
    ],
  },
};
