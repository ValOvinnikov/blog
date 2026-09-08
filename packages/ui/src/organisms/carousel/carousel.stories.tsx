import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel } from './carousel';

const SampleSlide = ({
  index,
  imageSrc,
}: {
  index: number;
  imageSrc?: string;
}) => (
  <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4">
    {imageSrc && (
      <img
        src={imageSrc}
        alt=""
        className="h-40 w-full rounded-md object-cover"
      />
    )}
    <p className="font-mono text-label text-muted uppercase">
      Slide {index + 1}
    </p>
    <p className="text-copy text-text">Sample carousel slide content.</p>
  </div>
);

const buildSlides = (count: number, withImages?: boolean) =>
  Array.from({ length: count }, (_, index) => (
    <SampleSlide
      key={index}
      index={index}
      imageSrc={
        withImages
          ? `https://picsum.photos/seed/carousel-${index}/640/360`
          : undefined
      }
    />
  ));

const meta = {
  title: 'Organisms/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ariaLabel: 'Latest posts',
    children: [
      ...buildSlides(3),
      <Carousel.Controls
        key="controls"
        previousLabel="Previous slide"
        nextLabel="Next slide"
        isPreviousDisabled={true}
        isNextDisabled={true}
      />,
    ],
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const RowThatFits: TStory = {};

export const RowThatScrolls: TStory = {
  args: {
    children: [
      ...buildSlides(8),
      <Carousel.Controls
        key="controls"
        previousLabel="Previous slide"
        nextLabel="Next slide"
        isPreviousDisabled={true}
      />,
    ],
  },
};

export const Enhanced: TStory = {
  args: {
    isEnhanced: true,
    children: [
      ...buildSlides(8),
      <Carousel.Controls
        key="controls"
        previousLabel="Previous slide"
        nextLabel="Next slide"
      />,
    ],
  },
};

export const NotEnhanced: TStory = {
  args: {
    isEnhanced: false,
  },
};

export const WithImages: TStory = {
  args: {
    children: [
      ...buildSlides(3, true),
      <Carousel.Controls
        key="controls"
        previousLabel="Previous slide"
        nextLabel="Next slide"
        isPreviousDisabled={true}
        isNextDisabled={true}
      />,
    ],
  },
};

export const WithoutImages: TStory = {};
