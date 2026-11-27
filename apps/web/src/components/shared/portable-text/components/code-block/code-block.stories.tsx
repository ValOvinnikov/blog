import { BRAND_VARIANT, type STORYBOOK_SKINS } from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CodeBlock } from './code-block';

const INVERSE_SKIN: keyof typeof STORYBOOK_SKINS = 'STORYBOOK_INVERSE';

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

export const Light: TStory = {};

export const Dark: TStory = {
  decorators: [
    (Story) => (
      <div className="dark bg-primary p-6">
        <Story />
      </div>
    ),
  ],
};

export const ScrollsSideways: TStory = {
  args: {
    code: `const greetings = ['${'hello, '.repeat(30)}'];`,
    filename: undefined,
  },
};

export const WithHighlightedLines: TStory = {
  args: { highlightedLines: [3] },
};

export const OnInverseSkin: TStory = {
  args: { highlightedLines: [3] },
  decorators: [
    (Story) => (
      <div data-skin={INVERSE_SKIN} className="bg-ambient p-6">
        <Story />
      </div>
    ),
  ],
};

export const OnBrandTint: TStory = {
  args: { highlightedLines: [3] },
  decorators: [
    (Story) => (
      <div data-skin={BRAND_VARIANT.BRAND_PRIMARY} className="bg-ambient p-6">
        <Story />
      </div>
    ),
  ],
};
