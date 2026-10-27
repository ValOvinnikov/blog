import { ACCOUNT_BUTTON_STYLE } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AccountTrigger } from './account-trigger';
import { accountTriggerVariants } from './account-trigger-variants';

const SIGNED_IN_USER = {
  name: 'Sam Reader',
  image: 'https://i.pravatar.cc/150?img=5',
};

const SPANISH_LABELS = { signIn: 'Iniciar sesión', account: 'Cuenta' };

const meta = {
  title: 'Molecules/AccountTrigger',
  component: AccountTrigger,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    appearance: {
      control: 'select',
      options: objectKeys(accountTriggerVariants.variants.appearance),
    },
  },
  args: {
    appearance: ACCOUNT_BUTTON_STYLE.PILL,
    labels: { signIn: 'Sign in', account: 'Account' },
    isOpen: false,
    panelId: 'account-panel',
    onClick: fn(),
  },
} satisfies Meta<typeof AccountTrigger>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const PillSignedOut: TStory = {};

export const PillSignedIn: TStory = {
  args: { user: SIGNED_IN_USER },
};

export const PillSignedInWithInitials: TStory = {
  args: { user: { name: SIGNED_IN_USER.name } },
};

export const PillOpen: TStory = {
  args: { user: SIGNED_IN_USER, isOpen: true },
};

export const CircleSignedOut: TStory = {
  args: { appearance: ACCOUNT_BUTTON_STYLE.CIRCLE },
};

export const CircleSignedIn: TStory = {
  args: { appearance: ACCOUNT_BUTTON_STYLE.CIRCLE, user: SIGNED_IN_USER },
};

export const SameWidthAcrossStates: TStory = {
  render: (args) => (
    <div className="flex flex-col items-end gap-3">
      <AccountTrigger {...args} />
      <AccountTrigger {...args} user={SIGNED_IN_USER} />
      <AccountTrigger {...args} labels={SPANISH_LABELS} />
      <AccountTrigger {...args} labels={SPANISH_LABELS} user={SIGNED_IN_USER} />
    </div>
  ),
};
