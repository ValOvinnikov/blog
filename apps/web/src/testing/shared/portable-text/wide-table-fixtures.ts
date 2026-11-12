import type { TPortableTextBody } from '@blog/service';

import {
  mockExpandableSectionBlock,
  mockPortableTextBlock,
  mockTableBlock,
  mockTableRow,
} from './fixtures';

const MOCK_WIDE_TABLE_CELLS = [
  ['Plan', 'Monthly price', 'Included seats', 'Custom domain', 'Support'],
  ['Free', '£0', '1 editor', 'Not included', 'Community forum'],
  ['Growth', '£24', '5 editors', 'Included', 'Email within two days'],
  ['Scale', '£96', 'Unlimited editors', 'Included', 'Email within four hours'],
];

export const MOCK_WIDE_TABLE_DEMO: TPortableTextBody = [
  mockPortableTextBlock(
    'A paragraph before a five column table. From the lg breakpoint a table widens past the text measure so its columns fit without scrolling.',
  ),
  mockTableBlock(
    MOCK_WIDE_TABLE_CELLS.map((row) =>
      mockTableRow(row.map((text) => mockPortableTextBlock(text))),
    ),
    1,
  ),
  mockExpandableSectionBlock('How seats are counted', [
    mockPortableTextBlock(
      'In a post an expandable section keeps the text measure; on a document page it spans the table width.',
    ),
  ]),
  mockPortableTextBlock(
    'A paragraph after the table, back at the regular text measure.',
  ),
];
