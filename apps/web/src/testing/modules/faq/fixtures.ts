import type { TFaqQuestion } from '@blog/service';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

export const makeFaqQuestion = (
  overrides: Partial<TFaqQuestion> = {},
): TFaqQuestion => ({
  id: 'faq-1',
  question: 'Do you offer a free trial?',
  answer: [portableTextBlock('Yes, every plan includes a 14-day free trial.')],
  ...overrides,
});

export const faqAnswerWithListAndLinkDemo: TFaqQuestion['answer'] = [
  portableTextBlock([
    portableTextSpan('Yes — every plan includes a '),
    portableTextSpan('14-day free trial', ['strong']),
    portableTextSpan(', no credit card required.'),
  ]),
  portableTextBlock([portableTextSpan('Full access to every feature')], {
    listItem: 'bullet',
  }),
  portableTextBlock([portableTextSpan('Cancel anytime before it ends')], {
    listItem: 'bullet',
  }),
  portableTextBlock(
    [
      portableTextSpan('See our '),
      portableTextSpan('pricing page', ['link-1']),
      portableTextSpan(' for full plan details.'),
    ],
    {
      markDefs: [
        {
          _type: 'linkRef',
          _key: 'link-1',
          link: { href: '/pricing', target: undefined },
        },
      ],
    },
  ),
];
