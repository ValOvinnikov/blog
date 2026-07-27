import { Size } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Heading } from './heading';
import { headingVariants } from './heading-variants';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    visual: {
      control: 'select',
      options: objectKeys(headingVariants.variants.visual),
    },
    size: {
      control: 'select',
      options: objectKeys(headingVariants.variants.size),
    },
  },
};
export default meta;

type TStory = StoryObj<typeof Heading>;

export const H1: TStory = {
  args: { level: 1, children: 'Heading Level 1' },
};

export const H2: TStory = {
  args: { level: 2, children: 'Heading Level 2' },
};

export const H3: TStory = {
  args: { level: 3, children: 'Heading Level 3' },
};

export const H4: TStory = {
  args: { level: 4, children: 'Heading Level 4' },
};

export const WithSizeOverride: TStory = {
  args: { level: 2, size: Size.XS, children: 'H2 with xs size override' },
};

export const VisualHero: TStory = {
  args: { level: 1, visual: 'hero', children: 'Hero Heading' },
};

export const VisualPost: TStory = {
  args: { level: 1, visual: 'post', children: 'Post Title Heading' },
};

export const VisualCard: TStory = {
  args: { level: 2, visual: 'card', children: 'Card Title Heading' },
};

export const VisualSection: TStory = {
  args: { level: 2, visual: 'section', children: 'Section Heading' },
};

export const VisualProseH2: TStory = {
  args: { level: 2, visual: 'prose-h2', children: 'Prose H2 Heading' },
};

export const VisualProseH3: TStory = {
  args: { level: 3, visual: 'prose-h3', children: 'Prose H3 Heading' },
};

export const VisualProseH4: TStory = {
  args: { level: 4, visual: 'prose-h4', children: 'Prose H4 Heading' },
};

/**
 * The `post` visual (the page's real title, e.g. `PostPage`'s h1) must
 * always read as the largest heading on the page. `prose-h2`/`prose-h3`/
 * `prose-h4` are sized for subheadings *within* the body copy — this story
 * puts them side by side so the size relationship stays visually checkable.
 */
export const InArticleHierarchy: TStory = {
  render: () => (
    <div className="flex max-w-prose flex-col gap-4">
      <Heading level={1} visual="post">
        The Post Title (h1, visual=&quot;post&quot;)
      </Heading>
      <Heading level={2} visual="prose-h2">
        A Body Subsection (h2, visual=&quot;prose-h2&quot;)
      </Heading>
      <Heading level={3} visual="prose-h3">
        A Nested Subsection (h3, visual=&quot;prose-h3&quot;)
      </Heading>
      <Heading level={4} visual="prose-h4">
        A Deeper Subsection (h4, visual=&quot;prose-h4&quot;)
      </Heading>
    </div>
  ),
};
