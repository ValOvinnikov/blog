import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel } from './carousel';
import { carouselVariants } from './carousel-variants';

type TSampleItem = { id: number; body: string };

const buildItems = (count: number): TSampleItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    body: faker.lorem.sentences(2),
  }));

const renderSampleItem = (item: TSampleItem, index: number) => (
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

const renderImageItem = (item: TImageItem) => (
  <img
    src={`https://picsum.photos/seed/carousel-${item.id}/640/360`}
    alt={item.alt}
    className="h-56 w-full rounded-lg object-cover"
  />
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
  },
  args: {
    ariaLabel: 'Latest posts',
    previousLabel: 'Previous slide',
    nextLabel: 'Next slide',
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

export const FullWidthSlides: TStory = {
  args: {
    slideSize: 'full',
    items: buildItems(4),
  },
};

export const WithPlainImages: TStory = {
  render: () => (
    <Carousel
      items={buildImageItems(6)}
      renderItem={renderImageItem}
      ariaLabel="Latest posts"
      previousLabel="Previous slide"
      nextLabel="Next slide"
    />
  ),
};
