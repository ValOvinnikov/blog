import { SIZE } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { ReducedMotion } from '@shinefold/ui/testing/reduced-motion';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

import { Spinner } from './spinner';
import { spinnerVariants } from './spinner-variants';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: {
    label: 'Loading',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: keys(spinnerVariants.variants.variant),
    },
    size: {
      control: 'select',
      options: keys(spinnerVariants.variants.size),
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithVisibleLabel: TStory = {
  args: { label: 'Posting comment', hasLabel: true },
};

export const Small: TStory = {
  args: { size: SIZE.SM, hasLabel: true },
};

export const Large: TStory = {
  args: { size: SIZE.LG, hasLabel: true },
};

const AllStyles = () => (
  <div className="flex flex-col gap-4 text-brand-primary">
    {keys(spinnerVariants.variants.variant).map((variant) => (
      <Spinner
        key={variant}
        label={variant}
        variant={variant}
        hasLabel={true}
      />
    ))}
  </div>
);

export const Styles: TStory = {
  render: () => <AllStyles />,
};

export const StylesWithReducedMotion: TStory = {
  render: () => (
    <ReducedMotion>
      <AllStyles />
    </ReducedMotion>
  ),
};

export const OnSolidFill: TStory = {
  args: { label: 'Subscribing', hasLabel: true },
  render: (args) => (
    <Button variant="primary">
      <Spinner {...args} />
    </Button>
  ),
};
