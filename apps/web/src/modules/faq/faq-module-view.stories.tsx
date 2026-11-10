import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import {
  MOCK_FAQ_ANSWER_WITH_LIST_AND_LINK,
  mockFaqModule,
  mockFaqQuestion,
} from '@web/testing/modules/faq/fixtures';

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
  args: {
    module: mockFaqModule({ questions }),
    titleId: 'faq-title',
    dataTestId: 'faq-module-faq-1',
  },
} satisfies Meta<typeof FaqModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const CenterAligned: TStory = {
  args: {
    module: mockFaqModule({
      questions,
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    }),
  },
};

export const WithActions: TStory = {
  args: { module: mockFaqModule({ questions, ctaButtons: MOCK_CTA_ACTIONS }) },
};

export const Secondary: TStory = {
  args: {
    module: mockFaqModule({ questions, brandVariant: BRAND_VARIANT.SECONDARY }),
  },
};

export const WithRichAnswer: TStory = {
  args: {
    module: mockFaqModule({
      questions: [
        mockFaqQuestion({
          id: 'faq-1',
          question: 'What does the free trial include?',
          answer: MOCK_FAQ_ANSWER_WITH_LIST_AND_LINK,
        }),
        ...questions.slice(1),
      ],
    }),
  },
};
