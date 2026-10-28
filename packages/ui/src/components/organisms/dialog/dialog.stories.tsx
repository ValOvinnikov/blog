import { SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { faker } from '@faker-js/faker';
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

const ReducedMotionDemo = (args: TDialogProps) => (
  <>
    {/*
      Storybook has no built-in way to emulate the OS-level
      `prefers-reduced-motion: reduce` media query, so this scoped override
      reproduces the component's own `motion-reduce:` utilities.
    */}
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
