import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LogoTile } from '../../molecules/logo-tile';
import { MediaCard } from '../../molecules/media-card';

import { CardGrid } from './card-grid';

const posts = [
  {
    href: '/posts/building-a-design-system',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
    tags: ['design-system', 'tailwind', 'react'],
    publishedAt: '2024-06-01T00:00:00Z',
    formattedDate: 'June 1, 2024',
    authorName: 'Jane Doe',
  },
  {
    href: '/posts/typescript-tips',
    title: 'TypeScript Tips for 2025',
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript'],
    publishedAt: '2024-05-15T00:00:00Z',
    formattedDate: 'May 15, 2024',
    authorName: 'Jane Doe',
  },
  {
    href: '/posts/atomic-design',
    title: 'Atomic Design in Practice',
    excerpt:
      'How to apply Atomic Design principles to a real-world component library.',
    tags: ['atomic-design', 'components'],
    publishedAt: '2024-04-20T00:00:00Z',
    formattedDate: 'April 20, 2024',
    authorName: 'Jane Doe',
  },
  {
    href: '/posts/accessible-forms',
    title: 'Building Accessible Forms',
    excerpt:
      'Practical patterns for labels, error states, and keyboard navigation in forms.',
    tags: ['accessibility', 'forms'],
    publishedAt: '2024-03-05T00:00:00Z',
    formattedDate: 'March 5, 2024',
    authorName: 'Jane Doe',
  },
];

const renderMediaCards = (items: typeof posts) =>
  items.map(
    ({
      href,
      title,
      excerpt,
      tags,
      publishedAt,
      formattedDate,
      authorName,
    }) => (
      <MediaCard key={href} excerpt={excerpt} tags={tags}>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
        <MediaCard.Footer
          publishedAt={publishedAt}
          formattedDate={formattedDate}
          authorName={authorName}
        />
      </MediaCard>
    ),
  );

const renderLogoTiles = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const alt = faker.company.name();
    return (
      <LogoTile key={`${alt}-${index}`}>
        <img
          src={faker.image.urlPicsumPhotos({ width: 160, height: 80 })}
          alt={alt}
        />
      </LogoTile>
    );
  });

const meta = {
  title: 'Organisms/CardGrid',
  component: CardGrid,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    columns: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
  },
  args: {
    children: renderMediaCards(posts.slice(0, 3)),
  },
} satisfies Meta<typeof CardGrid>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const ThreeColumns: TStory = {
  args: { columns: 3 },
};

export const TwoColumns: TStory = {
  args: { columns: 2, children: renderMediaCards(posts.slice(0, 2)) },
};

export const SingleColumn: TStory = {
  args: { columns: 1, children: renderMediaCards(posts.slice(0, 1)) },
};

export const FourColumns: TStory = {
  args: { columns: 4, children: renderMediaCards(posts) },
};

export const FiveColumns: TStory = {
  args: { columns: 5, children: renderLogoTiles(5) },
};

export const SixColumns: TStory = {
  args: { columns: 6, children: renderLogoTiles(6) },
};
