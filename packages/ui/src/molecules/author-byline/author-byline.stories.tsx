import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { AuthorByline } from './author-byline';

const meta = {
  title: 'Molecules/AuthorByline',
  component: AuthorByline,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    name: faker.person.fullName(),
    bio: faker.lorem.sentences(2),
  },
} satisfies Meta<typeof AuthorByline>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithAvatar: TStory = {
  args: { avatarUrl: faker.image.avatarGitHub() },
};

export const WithInitials: TStory = {};

export const WithoutBio: TStory = {
  args: { bio: undefined },
};
