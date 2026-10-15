import { SurfaceBands } from '@blog/ui/testing/surface-bands';
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
    ariaLabel: 'Message',
    placeholder: 'What would you like to say?',
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithValue: TStory = {
  args: {
    value:
      'Hello,\n\nI enjoyed your latest post and wanted to ask a follow-up question about the examples.',
  },
};

export const Invalid: TStory = {
  args: { isInvalid: true, value: 'Hi' },
};

export const Disabled: TStory = {
  args: { value: 'Thanks for writing.', isDisabled: true },
};

export const DisabledEmpty: TStory = {
  args: { value: '', isDisabled: true },
};

export const OnBands: TStory = {
  render: (args) => (
    <SurfaceBands>
      <Textarea {...args} />
      <Textarea {...args} isInvalid={true} value="Hi" />
      <Textarea {...args} isDisabled={true} value="Thanks for writing." />
    </SurfaceBands>
  ),
};

const InteractiveDemo = () => {
  const [value, setValue] = useState('');

  return (
    <Textarea
      value={value}
      onChange={setValue}
      ariaLabel="Message"
      placeholder="What would you like to say?"
    />
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
