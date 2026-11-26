import { TEXT_ROLE } from '@shinefold/config';
import { HEADING_LEVELS } from '@shinefold/ui/lib/react';
import { EveryBrandBand } from '@shinefold/ui/testing/brand-bands';
import {
  MOCK_ONE_HIGHLIGHT_PIECES,
  MOCK_TWO_HIGHLIGHT_PIECES,
} from '@shinefold/ui/testing/heading-pieces';
import { withShinefoldPreset } from '@shinefold/ui/testing/shinefold-preset';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

import { Heading } from './heading';
import { headingVariants } from './heading-variants';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    visual: {
      control: 'select',
      options: keys(headingVariants.variants.visual),
    },
    level: {
      control: 'select',
      options: HEADING_LEVELS,
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

export const HeroTitle: TStory = {
  args: { level: 1, visual: TEXT_ROLE.HERO_TITLE, children: 'Hero Title' },
};

export const PostTitle: TStory = {
  args: { level: 1, visual: TEXT_ROLE.POST_TITLE, children: 'Post Title' },
};

export const DialogTitle: TStory = {
  args: { level: 2, visual: TEXT_ROLE.DIALOG_TITLE, children: 'Dialog Title' },
};

export const InArticleHierarchy: TStory = {
  render: () => (
    <div className="flex max-w-prose flex-col gap-4">
      <Heading level={1} visual={TEXT_ROLE.POST_TITLE}>
        The Post Title
      </Heading>
      <Heading level={2} visual={TEXT_ROLE.PROSE_H2}>
        A Body Subsection
      </Heading>
      <Heading level={3} visual={TEXT_ROLE.PROSE_H3}>
        A Nested Subsection
      </Heading>
      <Heading level={4} visual={TEXT_ROLE.PROSE_H4}>
        A Deeper Subsection
      </Heading>
    </div>
  ),
};

export const OneHighlightOnEveryBrandBand: TStory = {
  args: {
    level: 2,
    visual: TEXT_ROLE.SECTION_TITLE,
    pieces: MOCK_ONE_HIGHLIGHT_PIECES,
  },
  render: (args) => (
    <EveryBrandBand>{() => <Heading {...args} />}</EveryBrandBand>
  ),
};

export const OneHighlightOnEveryBrandBandDark: TStory = {
  ...OneHighlightOnEveryBrandBand,
  globals: { theme: 'dark' },
};

export const TwoHighlightsOnEveryBrandBand: TStory = {
  ...OneHighlightOnEveryBrandBand,
  args: {
    level: 2,
    visual: TEXT_ROLE.SECTION_TITLE,
    pieces: MOCK_TWO_HIGHLIGHT_PIECES,
  },
};

export const TwoHighlightsOnEveryBrandBandDark: TStory = {
  ...TwoHighlightsOnEveryBrandBand,
  globals: { theme: 'dark' },
};

export const ShinefoldPreset: TStory = {
  ...H2,
  decorators: [withShinefoldPreset],
};
