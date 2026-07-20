import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { ShareButtons } from './share-buttons';

const meta = {
  title: 'Molecules/ShareButtons',
  component: ShareButtons,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    url: faker.internet.url(),
    title: faker.lorem.sentence(),
  },
} satisfies Meta<typeof ShareButtons>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithLongTitle: TStory = {
  args: {
    title: faker.lorem.sentences(2),
  },
};

export const LocalizedLabels: TStory = {
  args: {
    xLabel: 'Partager sur X',
    linkedInLabel: 'Partager sur LinkedIn',
    copyLabel: 'Copier le lien',
  },
};
