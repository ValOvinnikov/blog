import {
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  GRID_COLUMNS,
} from '@shinefold/config';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';

export const MOCK_DESIGN_SYSTEM_POST_ITEM = mockPostListItem({
  id: 'post-1',
  href: '/blog/building-a-design-system',
  title: 'Building a Design System from Scratch',
  excerpt:
    'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
  topic: { title: 'Design systems' },
});

export const MOCK_TYPESCRIPT_POST_ITEM = mockPostListItem({
  id: 'post-2',
  href: '/blog/typescript-tips',
  title: 'TypeScript Tips for 2026',
  excerpt: 'A collection of practical TypeScript patterns.',
  topic: { title: 'TypeScript' },
});

export const MOCK_POST_CARD_ITEMS = [
  MOCK_DESIGN_SYSTEM_POST_ITEM,
  MOCK_TYPESCRIPT_POST_ITEM,
];

const mockPlaceholderImage = (alt: string) => (
  // eslint-disable-next-line @next/next/no-img-element -- Storybook placeholder image, not a production asset; next/image would be wrong here
  <img src="https://placehold.co/640x360" alt={alt} />
);

export const mockWithPlaceholderImage = <T extends { title: string }>(
  item: T,
) => ({
  ...item,
  image: mockPlaceholderImage(item.title),
});

export const postCardsArgTypes = {
  columns: {
    control: 'select',
    options: [GRID_COLUMNS.TWO, GRID_COLUMNS.THREE, GRID_COLUMNS.FOUR],
  },
  contentAlignment: {
    control: 'select',
    options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
  },
  displayMode: {
    control: 'select',
    options: Object.values(DISPLAY_MODE),
  },
} as const;
