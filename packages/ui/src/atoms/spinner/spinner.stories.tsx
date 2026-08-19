import { Size } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
    size: {
      control: 'select',
      options: objectKeys(spinnerVariants.variants.size),
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** Glyph only — the common case inside a button or a status line, with the accessible name carried by `aria-label`. */
export const Default: TStory = {};

/** The `label` text is also rendered visibly beside the glyph. */
export const WithVisibleLabel: TStory = {
  args: { label: 'Posting comment', hasLabel: true },
};

/** Fits inside a compact footprint, such as beside an `Avatar` at `Size.SM`. */
export const Small: TStory = {
  args: { size: Size.SM, hasLabel: true },
};

/** The larger size for a more prominent standalone loading state. */
export const Large: TStory = {
  args: { size: Size.LG, hasLabel: true },
};

/** On a solid `Button` fill, the glyph swaps to `text-brand-primary-contrast` via `className` so it reads against the fill. */
export const OnSolidFill: TStory = {
  args: { label: 'Subscribing', hasLabel: true },
  render: (args) => (
    <Button variant="primary" isDisabled={true}>
      <Spinner {...args} className="text-brand-primary-contrast" />
    </Button>
  ),
};
