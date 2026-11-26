import { faker } from '@faker-js/faker';
import { ASIDE_KIND } from '@shinefold/config';
import { SHINEFOLD_PRESET_STORY } from '@shinefold/ui/testing/shinefold-preset';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Aside } from './aside';

const meta = {
  title: 'Molecules/Aside',
  component: Aside,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    kind: {
      control: 'select',
      options: Object.values(ASIDE_KIND),
    },
  },
  args: {
    children: <p>{faker.lorem.paragraphs(2, '\n\n')}</p>,
  },
} satisfies Meta<typeof Aside>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WhyNot: TStory = {
  args: { kind: ASIDE_KIND.WHY_NOT, label: 'Why not a queue here?' },
};

export const Digression: TStory = {
  args: { kind: ASIDE_KIND.DIGRESSION, label: 'Digression' },
};

export const Context: TStory = {
  args: { kind: ASIDE_KIND.CONTEXT, label: 'Context' },
};

export const Tip: TStory = {
  args: { kind: ASIDE_KIND.TIP, label: 'Tip' },
};

export const Note: TStory = {
  args: { kind: ASIDE_KIND.NOTE, label: 'Note' },
};

export const Warning: TStory = {
  args: { kind: ASIDE_KIND.WARNING, label: 'Warning' },
};

export const InArticleBody: TStory = {
  args: { kind: ASIDE_KIND.DIGRESSION, label: 'Digression' },
  render: (args) => (
    <div className="max-w-prose text-copy">
      <p>{faker.lorem.paragraph()}</p>
      <Aside {...args} />
      <p>{faker.lorem.paragraph()}</p>
    </div>
  ),
};

export const ShinefoldPreset: TStory = {
  ...InArticleBody,
  ...SHINEFOLD_PRESET_STORY,
};
