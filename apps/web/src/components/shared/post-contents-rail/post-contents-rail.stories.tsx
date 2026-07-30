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

/**
 * Desktop (≥1024px, Storybook's normal wide canvas): the sticky left-column
 * rail. The mobile disclosure trigger stays in the DOM (it's one `<nav>`
 * landmark with two presentations) but is hidden by the `lg:hidden` variant.
 */
export const Desktop: TStory = {};

/**
 * Mobile (<1024px): the closed-by-default disclosure — a list icon +
 * "On this page" label + chevron. The `lg:` variant fork this demonstrates
 * renders identically to `Desktop` at Storybook's normal wide canvas, so
 * this story pins `globals: { viewport: 'mobile' }` to self-demonstrate (the
 * `ui-storybook` skill's narrow "real breakpoint fork" exception).
 */
export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

/**
 * Same mobile viewport, expanded via a `play` interaction — demonstrates the
 * panel opening downward beneath the trigger.
 */
export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'On this page' }));
  },
};
