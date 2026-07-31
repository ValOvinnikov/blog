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
 * panel opening downward beneath the trigger, the "ON THIS PAGE" toggle row
 * visually separated from the list below it (the panel's own `pt-4`,
 * balancing its `pb-4`, plus the toggle bar's `border-b`), and the mobile
 * copy of each item wearing the share-menu-style row chrome (rounded,
 * padded, no border) instead of the old edge-to-edge block link.
 */
export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'On this page' }));
  },
};

/**
 * Hovering a mobile panel item — demonstrates the rounded `hover:bg-
 * surface-2` background the item now picks up from `PopoverMenuItem`'s own
 * row treatment, contained to the padded row rather than the full panel
 * width.
 */
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

/**
 * Keyboard-focusing a mobile panel item — demonstrates the contained focus
 * ring hugging the padded, rounded row instead of the old full-width `block`
 * link's edge-to-edge ring.
 */
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
