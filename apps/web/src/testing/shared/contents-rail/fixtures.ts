import type { TPortableTextBody } from '@blog/service';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import type { TContentsHeading } from '@web/utils/extract-contents-headings';

export const MOCK_GETTING_STARTED_HEADING: TContentsHeading = {
  text: 'Getting started',
  level: 2,
  key: 'getting-started',
};

export const MOCK_CONFIGURATION_HEADING: TContentsHeading = {
  text: 'Configuration',
  level: 2,
  key: 'configuration',
};

export const MOCK_CONTENTS_HEADINGS: TContentsHeading[] = [
  MOCK_GETTING_STARTED_HEADING,
  { text: 'Prerequisites', level: 3, key: 'prerequisites' },
  MOCK_CONFIGURATION_HEADING,
  { text: 'Deployment', level: 2, key: 'deployment' },
];

const MOCK_SECTION_TEXT =
  'A paragraph under the heading above, long enough to give the contents rail something to scroll past.';

export const MOCK_CONTENTS_RAIL_BODY: TPortableTextBody =
  MOCK_CONTENTS_HEADINGS.flatMap(({ text, level, key }) => [
    mockPortableTextBlock(text, { style: `h${level}`, key }),
    mockPortableTextBlock(MOCK_SECTION_TEXT),
  ]);
