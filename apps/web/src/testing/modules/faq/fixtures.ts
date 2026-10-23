import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import type { TFaqQuestion } from '@blog/service';
import {
  mockPortableTextBlock,
  mockPortableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

export const mockFaqQuestion = (
  overrides: Partial<TFaqQuestion> = {},
): TFaqQuestion => ({
  id: 'faq-1',
  question: 'Do you offer a free trial?',
  answer: [
    mockPortableTextBlock('Yes, every plan includes a 14-day free trial.'),
  ],
  ...overrides,
});

export const MOCK_FAQ_ANSWER_WITH_LIST_AND_LINK: TFaqQuestion['answer'] = [
  mockPortableTextBlock([
    mockPortableTextSpan('Yes — every plan includes a '),
    mockPortableTextSpan('14-day free trial', ['strong']),
    mockPortableTextSpan(', no credit card required.'),
  ]),
  mockPortableTextBlock(
    [mockPortableTextSpan('Full access to every feature')],
    {
      listItem: 'bullet',
    },
  ),
  mockPortableTextBlock(
    [mockPortableTextSpan('Cancel anytime before it ends')],
    {
      listItem: 'bullet',
    },
  ),
  mockPortableTextBlock(
    [
      mockPortableTextSpan('See our '),
      mockPortableTextSpan('pricing page', ['link-1']),
      mockPortableTextSpan(' for full plan details.'),
    ],
    {
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: 'link-1',
          link: { href: '/pricing', target: undefined },
        },
      ],
    },
  ),
];
