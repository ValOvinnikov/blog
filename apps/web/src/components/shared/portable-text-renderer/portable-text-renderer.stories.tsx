import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { PortableTextRenderer } from './portable-text-renderer';

const meta = {
  title: 'Components/PortableTextRenderer',
  component: PortableTextRenderer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    value: richTextDemo,
  },
} satisfies Meta<typeof PortableTextRenderer>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Multiple sibling block types back to back (headings at every level,
 * paragraphs, marks, a code block, a `bodyImage` image) — the layout
 * regression this covers is missing vertical spacing between them, which
 * would render as one unbroken block of text. Also demonstrates the
 * `prose-h2`/`prose-h3`/`prose-h4` visual step-down: each heading level
 * reads clearly smaller than the one above it, and all sit below the page's
 * own title size.
 *
 * The `bodyImage` block renders through `ImageWithCaption`, using the
 * fixture's `FLOAT_LEFT` layout — at the `md` breakpoint and wider, the
 * closing paragraph wraps around it; below `md`, it renders full width
 * above the text.
 */
export const Content: TStory = {};
