import { SurfaceBands } from '@blog/ui/testing/surface-bands';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: {
    isChecked: false,
    onChange: () => {},
  },
};
export default meta;

type TStory = StoryObj<typeof Switch>;

export const Off: TStory = {
  args: { isChecked: false },
};

export const On: TStory = {
  args: { isChecked: true },
};

export const Locked: TStory = {
  args: { isChecked: true, isLocked: true },
};

export const OnBands: TStory = {
  render: (args) => (
    <SurfaceBands>
      <div className="flex gap-4">
        <Switch {...args} isChecked={false} />
        <Switch {...args} isChecked={true} />
      </div>
    </SurfaceBands>
  ),
};

const InteractiveDemo = () => {
  const [isChecked, setIsChecked] = useState(false);

  return <Switch isChecked={isChecked} onChange={setIsChecked} />;
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};
