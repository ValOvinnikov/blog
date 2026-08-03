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

export const WithPrompt: TStory = {
  args: { prompt: '›' },
};

export const Invalid: TStory = {
  args: { invalid: true, value: 'not-an-email', prompt: '›' },
};

const InteractiveDemo = () => {
  const [value, setValue] = useState('');

  return (
    <TextInput
      value={value}
      onChange={setValue}
      ariaLabel="Email address"
      placeholder="you@example.com"
      prompt="›"
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
