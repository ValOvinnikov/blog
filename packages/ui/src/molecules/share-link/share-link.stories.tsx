import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShareLink } from './share-link';

const meta = {
  title: 'Molecules/ShareLink',
  component: ShareLink,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    href: faker.internet.url(),
    label: 'Share on X',
    icon: <Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />,
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
