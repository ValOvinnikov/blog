import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { PortableTextRenderer } from './portable-text-renderer';

const meta = {
  title: 'Components/PortableTextRenderer',
  component: PortableTextRenderer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { value: richTextDemo },
} satisfies Meta<typeof PortableTextRenderer>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Multiple sibling block types back to back (headings at every level,
 * paragraphs, marks, a code block, an `imageWithAlt` image) — the layout
 * regression this covers is missing vertical spacing between them, which
 * would render as one unbroken block of text. Also demonstrates the
 * `prose-h2`/`prose-h3`/`prose-h4` visual step-down: each heading level
 * reads clearly smaller than the one above it, and all sit below the page's
 * own title size. The image points at a fake asset id, so it renders with a
 * broken `src` here — it still exercises the `imageWithAlt` block component
 * and its layout (spacing, rounded corners, alt text).
 */
export const Content: TStory = {};
