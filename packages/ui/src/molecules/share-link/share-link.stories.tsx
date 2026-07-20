import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { ExternalLink } from 'lucide-react';

import { ShareLink } from './share-link';

const meta = {
  title: 'Molecules/ShareLink',
  component: ShareLink,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    href: faker.internet.url(),
    label: 'Share on X',
    icon: <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />,
  },
} satisfies Meta<typeof ShareLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutIcon: TStory = {
  args: {
    icon: undefined,
  },
};
