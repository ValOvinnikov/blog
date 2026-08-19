import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Textarea } from './textarea';

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    ariaLabel: 'Comment body',
    placeholder: 'Add to the discussion...',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithPrompt: TStory = {
  args: { prompt: '$' },
};

export const Invalid: TStory = {
  args: { invalid: true, value: 'x', prompt: '$' },
};

export const WithMaxLength: TStory = {
  args: { maxLength: 280 },
};

export const Disabled: TStory = {
  args: { value: 'Locked for editing.', isDisabled: true },
};

const InteractiveDemo = () => {
  const [value, setValue] = useState('');

  return (
    <Textarea
      value={value}
      onChange={setValue}
      ariaLabel="Comment body"
      placeholder="Add to the discussion..."
      prompt="$"
      rows={4}
      maxLength={280}
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
