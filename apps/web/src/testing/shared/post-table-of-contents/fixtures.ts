import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';

export const MOCK_GETTING_STARTED_HEADING: TPostHeading = {
  text: 'Getting started',
  level: 2,
  key: 'getting-started',
};

export const MOCK_CONFIGURATION_HEADING: TPostHeading = {
  text: 'Configuration',
  level: 2,
  key: 'configuration',
};

export const MOCK_POST_HEADINGS: TPostHeading[] = [
  MOCK_GETTING_STARTED_HEADING,
  { text: 'Prerequisites', level: 3, key: 'prerequisites' },
  MOCK_CONFIGURATION_HEADING,
  { text: 'Deployment', level: 2, key: 'deployment' },
];
