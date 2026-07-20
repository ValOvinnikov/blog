import type { Meta, StoryObj } from '@storybook/react';
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
 * Multiple sibling block types back to back (heading, paragraphs, marks, a
 * code block) — the layout regression this covers is missing vertical
 * spacing between them, which would render as one unbroken block of text.
 */
export const Content: TStory = {};
