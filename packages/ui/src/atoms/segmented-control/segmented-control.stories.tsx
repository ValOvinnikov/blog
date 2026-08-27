import { DEPTH } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SegmentedControl } from './segmented-control';

const options = [
  { value: DEPTH.SKIM, label: '30s' },
  { value: DEPTH.READ, label: 'Read' },
  { value: DEPTH.DEEP, label: 'Deep' },
];

const meta = {
  title: 'Atoms/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  args: {
    options,
    ariaLabel: 'Reading depth',
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Skim: TStory = {
  args: { value: DEPTH.SKIM },
};

export const Read: TStory = {
  args: { value: DEPTH.READ },
};

export const Deep: TStory = {
  args: { value: DEPTH.DEEP },
};

const InteractiveDemo = () => {
  const [value, setValue] = useState<(typeof options)[number]['value']>(
    DEPTH.READ,
  );

  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={setValue}
      ariaLabel="Reading depth"
    />
  );
};

export const Interactive: TStory = {
  args: { value: DEPTH.READ },
  render: () => <InteractiveDemo />,
};
