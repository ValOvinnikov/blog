import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TPortableTextBlock,
} from '@shinefold/config';
import {
  mockPortableTextBlock,
  mockPortableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

export const MOCK_PARAGRAPH_LIST_PARAGRAPH: TPortableTextBlock[] = [
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
