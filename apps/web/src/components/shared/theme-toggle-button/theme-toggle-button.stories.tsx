import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';
import { userEvent, within } from 'storybook/test';

import { ThemeToggleButton } from './theme-toggle-button';

const meta = {
  title: 'Components/ThemeToggleButton',
  component: ThemeToggleButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ThemeToggleButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Light: TStory = {};

/**
 * Flips `document.documentElement`'s `dark` class before mount, cleaning up
 * on unmount — the same DOM state the component reads on its own mount
 * effect (set in real usage by the pre-hydration theme bootstrap script), so
 * the button settles on its "switch to light" icon without any click.
 */
export const Dark: TStory = {
  decorators: [
    (Story) => {
      useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => document.documentElement.classList.remove('dark');
      }, []);

      return (
        <div className="bg-primary p-6">
          <Story />
        </div>
      );
    },
  ],
};

export const ToggledByClick: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button');
    await userEvent.click(button);
  },
};
