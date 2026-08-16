import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CodeBlock } from './code-block';

const SAMPLE_CODE = `// Greets a visitor by name
function greet(name: string): string {
  const greeting = \`Hello, \${name}!\`;
  const isLoud = name.length > 10;
  return isLoud ? greeting.toUpperCase() : greeting;
}`;

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    code: SAMPLE_CODE,
    language: 'typescript',
    filename: 'greet.ts',
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Light theme (default) — the code block's background is `bg-surface-2`
 * from the wrapping `<figure>`; syntax token colors read from the `:root`
 * `--code-*` custom properties in `index.css`.
 */
export const Light: TStory = {};

/**
 * Dark theme — wraps the story in a `.dark`-classed container, the same
 * mechanism `apps/web`'s `ThemeToggleButton` applies to `<html>` at runtime.
 * `.dark` flips `--surface-2` and every `--code-*` token in `index.css`, so
 * the code block's background and syntax colors follow it without any
 * client-side theme-detection code in `CodeBlock` itself.
 */
export const Dark: TStory = {
  decorators: [
    (Story) => (
      <div className="dark bg-primary p-6">
        <Story />
      </div>
    ),
  ],
};

/**
 * Highlighted lines use the theme-aware `bg-brand-primary-muted`.
 */
export const WithHighlightedLines: TStory = {
  args: { highlightedLines: [3] },
};
