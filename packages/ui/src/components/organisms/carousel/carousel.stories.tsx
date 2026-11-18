import { faker } from '@faker-js/faker';
import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { objectKeys } from '@shinefold/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel } from './carousel';
import { carouselVariants } from './carousel-variants';

const LATEST_POSTS = 'Latest posts';
const TRUSTED_BY = 'Trusted by';
const PREVIOUS_SLIDE = 'Previous slide';
const NEXT_SLIDE = 'Next slide';

type TSampleItem = { id: number; body: string };

const buildItems = (count: number): TSampleItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    body: faker.lorem.sentences(2),
  }));

const renderSampleItem = ({
  item,
  index,
}: {
  item: TSampleItem;
  index: number;
}) => (
  <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4">
    <p className="font-mono text-label text-muted uppercase">
      Slide {index + 1}
    </p>
    <p className="text-copy text-text">{item.body}</p>
  </div>
);

type TImageItem = { id: number; alt: string };

const buildImageItems = (count: number): TImageItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    alt: faker.lorem.words(4),
  }));

const renderImageItem = ({ item }: { item: TImageItem }) => (
  <img
    src={`https://picsum.photos/seed/carousel-${item.id}/640/360`}
    alt={item.alt}
    className="h-56 w-full rounded-lg object-cover"
  />
);

type TLogoItem = { id: number; name: string };

const buildLogoItems = (count: number): TLogoItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    name: faker.company.name(),
  }));

const renderLogoItem = ({ item }: { item: TLogoItem }) => (
  <div className="flex size-48 items-center justify-center rounded-lg border border-border bg-surface p-4">
    <p className="text-center font-mono text-label text-muted uppercase">
      {item.name}
    </p>
  </div>
);

const meta = {
  title: 'Organisms/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    slideSize: {
      control: 'select',
      options: objectKeys(carouselVariants.variants.slideSize),
    },
    contentAlignment: {
      control: 'select',
      options: objectKeys(carouselVariants.variants.alignment),
    },
  },
  args: {
    ariaLabel: LATEST_POSTS,
    previousLabel: PREVIOUS_SLIDE,
    nextLabel: NEXT_SLIDE,
    items: buildItems(3),
    renderItem: renderSampleItem,
  },
} satisfies Meta<typeof Carousel<TSampleItem>>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const RowThatFits: TStory = {};

export const RowThatScrolls: TStory = {
  args: {
    items: buildItems(8),
  },
};

export const SteppedSlideSize: TStory = {
  args: {
    items: buildItems(8),
    slideSize: 'stepped',
  },
};

// The slide basis steps at real viewport breakpoints, so each width is pinned.
export const SingleHalvesThirdsOnPhone: TStory = {
  args: { items: buildItems(8), slideSize: 'singleHalvesThirds' },
  globals: { viewport: 'phone' },
};

export const SingleHalvesThirdsOnTablet: TStory = {
  args: { items: buildItems(8), slideSize: 'singleHalvesThirds' },
  globals: { viewport: 'tablet' },
};

export const SingleHalvesThirdsOnDesktop: TStory = {
  args: { items: buildItems(8), slideSize: 'singleHalvesThirds' },
  globals: { viewport: 'desktop' },
};

export const FewerItemsThanFit: TStory = {
  args: {
    items: buildItems(2),
  },
};

export const WithPlainImages: TStory = {
  render: () => (
    <Carousel
      items={buildImageItems(6)}
      renderItem={renderImageItem}
      ariaLabel={LATEST_POSTS}
      previousLabel={PREVIOUS_SLIDE}
      nextLabel={NEXT_SLIDE}
    />
  ),
};

export const FixedWidthContentSizing: TStory = {
  render: () => (
    <Carousel
      items={buildLogoItems(10)}
      renderItem={renderLogoItem}
      ariaLabel={TRUSTED_BY}
      previousLabel={PREVIOUS_SLIDE}
      nextLabel={NEXT_SLIDE}
      slideSize="content"
    />
  ),
};

export const AlignedLeftFitsViewport: TStory = {
  render: () => (
    <Carousel
      items={buildLogoItems(3)}
      renderItem={renderLogoItem}
      ariaLabel={TRUSTED_BY}
      previousLabel={PREVIOUS_SLIDE}
      nextLabel={NEXT_SLIDE}
      slideSize="content"
      contentAlignment={CONTENT_ALIGNMENT.LEFT}
    />
  ),
};

export const AlignedCenterFitsViewport: TStory = {
  render: () => (
    <Carousel
      items={buildLogoItems(3)}
      renderItem={renderLogoItem}
      ariaLabel={TRUSTED_BY}
      previousLabel={PREVIOUS_SLIDE}
      nextLabel={NEXT_SLIDE}
      slideSize="content"
      contentAlignment={CONTENT_ALIGNMENT.CENTER}
    />
  ),
};

export const AlignedCenterOverflowsStaysLeft: TStory = {
  render: () => (
    <Carousel
      items={buildLogoItems(10)}
      renderItem={renderLogoItem}
      ariaLabel={TRUSTED_BY}
      previousLabel={PREVIOUS_SLIDE}
      nextLabel={NEXT_SLIDE}
      slideSize="content"
      contentAlignment={CONTENT_ALIGNMENT.CENTER}
    />
  ),
};

export const FractionSlidesAlignedLeft: TStory = {
  args: { items: buildItems(2), contentAlignment: CONTENT_ALIGNMENT.LEFT },
};

export const FractionSlidesAlignedCenter: TStory = {
  args: { items: buildItems(2), contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const FractionSlidesAlignedCenterOverflowsStaysLeft: TStory = {
  args: { items: buildItems(8), contentAlignment: CONTENT_ALIGNMENT.CENTER },
};
