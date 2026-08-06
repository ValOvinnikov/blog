import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './spinner';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: {
    label: 'Loading',
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** Glyph only — the common case inside a button or a status line, with the accessible name carried by `aria-label`. */
export const Default: TStory = {};

/** The `label` text is also rendered visibly beside the glyph. */
export const WithVisibleLabel: TStory = {
  args: { label: 'Posting comment', showLabel: true },
};

/** On a solid button fill, the glyph swaps to `--accent-contrast` via `className`. */
export const OnSolidFill: TStory = {
  args: { label: 'Subscribing', showLabel: true },
  render: (args) => (
    <button
      type="button"
      disabled
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6ch',
        background: 'var(--accent-solid)',
        color: 'var(--accent-contrast)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem 1rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <Spinner {...args} className="text-accent-contrast" />
    </button>
  ),
};
