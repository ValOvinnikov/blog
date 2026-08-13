import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwitchShell } from './switch-shell';

const meta = {
  title: 'Atoms/SwitchShell',
  component: SwitchShell,
  tags: ['autodocs'],
} satisfies Meta<typeof SwitchShell>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Off: TStory = {};

export const On: TStory = {
  render: () => <SwitchShell aria-checked="true" data-checked="" />,
};

export const Disabled: TStory = {
  render: () => (
    <SwitchShell disabled={true} aria-disabled="true" data-disabled="" />
  ),
};

export const Focused: TStory = {
  args: { autoFocus: true },
};
