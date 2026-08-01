import { ASIDE_KIND } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Aside } from './aside';

const meta = {
  title: 'Molecules/Aside',
  component: Aside,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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
