import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel } from './carousel';
import { carouselVariants } from './carousel-variants';

const SampleSlide = ({ index }: { index: number }) => (
  <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4">
    <p className="font-mono text-label text-muted uppercase">
      Slide {index + 1}
    </p>
    <p className="text-copy text-text">{faker.lorem.sentences(2)}</p>
  </div>
);

const buildSlides = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <SampleSlide key={index} index={index} />
  ));

const buildImageSlides = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <img
      key={index}
      src={`https://picsum.photos/seed/carousel-${index}/640/360`}
      alt={faker.lorem.words(4)}
      className="h-56 w-full rounded-lg object-cover"
    />
  ));

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
    children: buildSlides(3),
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const RowThatFits: TStory = {};

export const RowThatScrolls: TStory = {
  args: {
    children: buildSlides(8),
  },
};

export const FullWidthSlides: TStory = {
  args: {
    slideSize: 'full',
    children: buildSlides(4),
  },
};

export const WithPlainImages: TStory = {
  args: {
    children: buildImageSlides(6),
  },
};
