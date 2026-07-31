import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockPostHeadings } from '@web/testing/shared/post-contents-rail/fixtures';
import { userEvent, within } from 'storybook/test';

import { PostContentsRail } from './post-contents-rail';

const meta = {
  title: 'Components/PostContentsRail',
  component: PostContentsRail,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { headings: mockPostHeadings },
} satisfies Meta<typeof PostContentsRail>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

/**
 * Pins the mobile viewport — the `lg:` fork this demonstrates renders
 * identically to `Desktop` at Storybook's normal wide canvas otherwise.
 */
export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'On this page' }));
  },
};

// Both desktop and mobile link copies of each heading share the same
// accessible name; `links.at(-1)` targets the mobile one under test here.
export const MobileOpenItemHover: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'On this page' }));
    const links = canvas.getAllByRole('link', {
      name: mockPostHeadings.at(0)?.text,
    });
    await userEvent.hover(links.at(-1)!);
  },
};

export const MobileOpenItemFocus: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'On this page' }));
    const links = canvas.getAllByRole('link', {
      name: mockPostHeadings.at(0)?.text,
    });
    links.at(-1)!.focus();
  },
};
