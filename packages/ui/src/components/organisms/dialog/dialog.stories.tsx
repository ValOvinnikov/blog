import { faker } from '@faker-js/faker';
import { SIZE } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Dialog, type TDialogProps } from './dialog';

const DialogDemo = (args: TDialogProps) => {
  const [isOpen, setIsOpen] = useState(args.isOpen);

  return (
    <>
      <Button variant="primary" size={SIZE.MD} onClick={() => setIsOpen(true)}>
        Open dialog
      </Button>
      <Dialog {...args} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

const meta = {
  title: 'Organisms/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    isOpen: true,
    onOpenChange: () => {},
    heading: 'Cookie settings',
    headingLevel: 2,
    closeLabel: 'Close',
    children: <p>{faker.lorem.paragraph()}</p>,
  },
  argTypes: {
    headingLevel: { control: 'select', options: [1, 2, 3, 4] },
  },
  render: (args) => <DialogDemo {...args} />,
} satisfies Meta<typeof Dialog>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Open: TStory = {};

export const OpenDark: TStory = {
  globals: { theme: 'dark' },
};

export const Closed: TStory = {
  args: { isOpen: false },
};

export const TopLevelHeading: TStory = {
  args: { headingLevel: 1 },
};

export const LongContent: TStory = {
  args: {
    children: Array.from({ length: 12 }, () => faker.lorem.paragraph()).map(
      (paragraph) => <p key={paragraph}>{paragraph}</p>,
    ),
  },
};

// Storybook cannot emulate `prefers-reduced-motion`, so this override reproduces the component's `motion-reduce:` utilities.
const ReducedMotionDemo = (args: TDialogProps) => (
  <>
    <style>{`
      [data-testid="dialog-reduced-motion"],
      [data-testid="dialog-backdrop"] {
        transition: none !important;
      }
    `}</style>
    <DialogDemo {...args} dataTestId="dialog-reduced-motion" />
  </>
);

export const ReducedMotion: TStory = {
  args: { isOpen: false },
  render: (args) => <ReducedMotionDemo {...args} />,
};
