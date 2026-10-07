import type { Meta, StoryObj } from '@storybook/react-vite';

import { CardLink } from './card-link';

const meta: Meta<typeof CardLink> = {
  title: 'Atoms/CardLink',
  component: CardLink,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative item-card surface-card px-card-x py-card-y">
        <Story />
        <p className="text-muted">The whole card is the link target.</p>
      </div>
    ),
  ],
};
export default meta;

type TStory = StoryObj<typeof CardLink>;

export const Default: TStory = {
  args: { href: '#', children: 'Hello World' },
};

export const WithAriaLabel: TStory = {
  args: { href: '#', ariaLabel: 'Visit Acme', children: 'Acme' },
};
