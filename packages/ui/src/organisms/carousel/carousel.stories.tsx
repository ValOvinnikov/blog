import { BRAND_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel } from './carousel';

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

const meta = {
  title: 'Organisms/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    tone: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
  },
  args: {
    ariaLabel: 'Latest posts',
    previousLabel: 'Previous slide',
    nextLabel: 'Next slide',
    items: buildItems(3),
    renderItem: renderSampleItem,
    slideClassName: 'basis-[85%] sm:basis-1/2 md:basis-1/3',
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

export const WithPlainImages: TStory = {
  render: () => (
    <Carousel
      items={buildImageItems(6)}
      renderItem={renderImageItem}
      slideClassName="basis-full"
      ariaLabel="Latest posts"
      previousLabel="Previous slide"
      nextLabel="Next slide"
    />
  ),
};
