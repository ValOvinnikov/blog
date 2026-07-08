import { NavLink } from '@blog/ui/atoms/nav-link/nav-link';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { ActionList } from './action-list';

const meta = {
  title: 'Molecules/ActionList',
  component: ActionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ActionList>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  render: () => (
    <ActionList>
      <NavLink href="/blog">{faker.lorem.words(2)}</NavLink>
      <NavLink href="/about">{faker.lorem.words(2)}</NavLink>
    </ActionList>
  ),
};
