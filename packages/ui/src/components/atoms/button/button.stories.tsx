import { SIZE } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from 'storybook/test';

import { Button } from './button';
import { buttonVariants } from './button-variants';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(buttonVariants.variants.variant),
    },
    size: {
      control: 'select',
      options: objectKeys(buttonVariants.variants.size),
    },
  },
};
export default meta;

type TStory = StoryObj<typeof Button>;

export const Primary: TStory = {
  args: { children: 'Publish', variant: 'primary', size: SIZE.MD },
};

export const Ghost: TStory = {
  args: { children: 'Cancel', variant: 'ghost' },
};

export const Link: TStory = {
  args: { children: 'Read more', variant: 'link' },
};

export const Danger: TStory = {
  args: { children: 'delete account', variant: 'danger' },
};

export const DangerDisabled: TStory = {
  args: { children: 'delete account', variant: 'danger', isDisabled: true },
};

export const Small: TStory = {
  args: { children: 'Tag', size: SIZE.SM },
};

export const Large: TStory = {
  args: { children: 'Get started', size: SIZE.LG },
};

export const Disabled: TStory = {
  args: { children: 'Disabled', isDisabled: true },
};

const OnSecondary = () => (
  <div className="bg-secondary surface-secondary" style={{ padding: '1.5rem' }}>
    <Button variant="primary">Continue</Button>
  </div>
);

export const OnSecondaryBackgroundFocused: TStory = {
  name: 'On a Secondary background, focused',
  render: OnSecondary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button').focus();
  },
};

const OnBrandPrimary = () => (
  <div
    className="bg-brand-primary-muted surface-brand-primary"
    style={{ padding: '1.5rem' }}
  >
    <Button variant="primary">Continue</Button>
  </div>
);

export const OnBrandPrimaryBackgroundFocused: TStory = {
  name: 'On a Brand-primary background, focused',
  render: OnBrandPrimary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button').focus();
  },
};
