import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';

/**
 * A representative 3-H2 (plus one nested H3) outline — the minimum shape
 * that earns `PostContentsRail` a render (`BlogPostPage` never passes it
 * fewer than 3 headings).
 */
export const mockPostHeadings: TPostHeading[] = [
  { id: 'getting-started', text: 'Getting started', level: 2, key: 'block-1' },
  { id: 'prerequisites', text: 'Prerequisites', level: 3, key: 'block-2' },
  { id: 'configuration', text: 'Configuration', level: 2, key: 'block-3' },
  { id: 'deployment', text: 'Deployment', level: 2, key: 'block-4' },
];
