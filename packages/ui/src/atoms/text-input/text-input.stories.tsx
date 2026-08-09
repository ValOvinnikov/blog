import { ICONS, Size } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TextInput } from './text-input';

const meta = {
  title: 'Atoms/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    ariaLabel: 'Email address',
    placeholder: 'you@example.com',
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithLeadingIcon: TStory = {
  args: { leadingIcon: '›' },
};

/** `leadingIcon` accepts any `ReactNode`, not just a glyph — e.g. an `Icon`. */
export const WithLeadingIconAsIcon: TStory = {
  args: { leadingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={Size.SM} /> },
};

export const WithTrailingIcon: TStory = {
  args: { trailingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={Size.SM} /> },
};

export const WithLeadingAndTrailingIcon: TStory = {
  args: {
    leadingIcon: '›',
    trailingIcon: <Icon name={ICONS.CHEVRON_RIGHT} size={Size.SM} />,
  },
};

export const Invalid: TStory = {
  args: { invalid: true, value: 'not-an-email', leadingIcon: '›' },
};

const InteractiveDemo = () => {
  const [value, setValue] = useState('');

  return (
    <TextInput
      value={value}
      onChange={setValue}
      ariaLabel="Email address"
      placeholder="you@example.com"
      leadingIcon="›"
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
