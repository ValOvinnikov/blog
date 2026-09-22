import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';

/**
 * A representative 3-H2 (plus one nested H3) outline — the minimum shape
 * that earns `PostContentsRail` a render (`BlogPostPage` never passes it
 * fewer than 3 headings).
 */
export const mockPostHeadings: TPostHeading[] = [
  { text: 'Getting started', level: 2, key: 'getting-started' },
  { text: 'Prerequisites', level: 3, key: 'prerequisites' },
  { text: 'Configuration', level: 2, key: 'configuration' },
  { text: 'Deployment', level: 2, key: 'deployment' },
];
