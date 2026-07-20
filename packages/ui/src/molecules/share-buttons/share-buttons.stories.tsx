import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { ExternalLink } from 'lucide-react';

import { ShareButtons } from './share-buttons';

const meta = {
  title: 'Molecules/ShareButtons',
  component: ShareButtons,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    links: [
      {
        href: faker.internet.url(),
        label: 'Share on X',
        icon: (
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        ),
      },
      {
        href: faker.internet.url(),
        label: 'Share on LinkedIn',
        icon: (
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        ),
      },
    ],
  },
} satisfies Meta<typeof ShareButtons>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const LocalizedLabels: TStory = {
  args: {
    links: [
      {
        href: faker.internet.url(),
        label: 'Partager sur X',
        icon: (
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        ),
      },
      {
        href: faker.internet.url(),
        label: 'Partager sur LinkedIn',
        icon: (
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        ),
      },
    ],
    copyLabel: 'Copier le lien',
  },
};
