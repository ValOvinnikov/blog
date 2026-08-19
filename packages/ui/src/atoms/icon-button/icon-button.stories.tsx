import { ICONS, Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconButton } from './icon-button';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Action',
    children: <Icon name={ICONS.SUN} size={Size.SM} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

// Hover the rendered button in the canvas to check the hover affordance —
// the `border-emphasis` ring clears WCAG 1.4.11's 3:1 non-text minimum
// against `bg` on its own in both themes (see icon-button-variants.ts),
// with the `surface-2` fill as a secondary tint.
export const Default: TStory = {};

export const WithMoonIcon: TStory = {
  args: {
    ariaLabel: 'Switch to dark theme',
    children: <Icon name={ICONS.MOON} size={Size.SM} />,
  },
};

export const Disabled: TStory = {
  args: { isDisabled: true },
};

export const Bordered: TStory = {
  args: {
    variant: 'bordered',
    ariaLabel: 'Sign in',
    children: 'Sign in',
  },
};

export const AvatarVariant: TStory = {
  name: 'Avatar',
  args: {
    variant: 'avatar',
    ariaLabel: 'Open account menu',
    children: <Avatar name="Ada Lovelace" alt="" size={Size.SM} />,
  },
};
