import { TOAST_TYPE } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toast } from './toast';
import { toastVariants } from './toast-variants';

const meta = {
  title: 'Molecules/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: objectKeys(toastVariants.variants.type),
    },
    phase: {
      control: 'select',
      options: objectKeys(toastVariants.variants.phase),
    },
  },
  args: {
    type: TOAST_TYPE.SUCCESS,
    command: 'bookmark',
    state: 'saved',
    message: 'stashed to ~/bookmarks',
    time: 'just now',
    dismissLabel: 'Dismiss notification',
    onDismiss: () => {},
    phase: 'visible',
    durationMs: 3600,
  },
} satisfies Meta<typeof Toast>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Success: TStory = {};

export const Info: TStory = {
  args: {
    type: TOAST_TYPE.INFO,
    command: 'bookmark',
    state: 'removed',
    message: 'removed from ~/bookmarks',
  },
};

export const Warning: TStory = {
  args: {
    type: TOAST_TYPE.WARNING,
    command: 'comment',
    state: 'queued',
    message: 'posted — awaiting review',
    durationMs: 5000,
  },
};

export const Error: TStory = {
  args: {
    type: TOAST_TYPE.ERROR,
    command: 'bookmark',
    state: 'failed',
    message: "couldn't save — retry?",
    durationMs: undefined,
    action: { label: 'retry', onAct: () => {}, keyHint: 'R' },
  },
};

export const Loading: TStory = {
  args: {
    type: TOAST_TYPE.INFO,
    isLoading: true,
    command: 'bookmark',
    state: 'saving',
    message: 'saving…',
    time: undefined,
    durationMs: undefined,
  },
};

export const WithAction: TStory = {
  args: {
    action: { label: 'undo', onAct: () => {}, keyHint: '⌘Z' },
  },
};

export const Paused: TStory = {
  args: {
    action: { label: 'undo', onAct: () => {}, keyHint: '⌘Z' },
    isPaused: true,
  },
};

export const Plain: TStory = {
  args: {
    isPlain: true,
    command: undefined,
    state: undefined,
    action: { label: 'undo', onAct: () => {}, keyHint: '⌘Z' },
  },
};

const ReducedMotionDemo = () => (
  <>
    {/*
      Storybook has no built-in way to emulate the OS-level
      `prefers-reduced-motion: reduce` media query, so this scoped override
      reproduces the same rules the component's own `motion-reduce:`
      utilities apply, for documentation purposes only.
    */}
    <style>{`
      [data-testid="toast-reduced-motion"] {
        transition: opacity var(--duration-base) linear !important;
        transform: none !important;
      }
      [data-testid="toast-reduced-motion-timer"] {
        display: none !important;
      }
    `}</style>
    <Toast
      type={TOAST_TYPE.SUCCESS}
      command="bookmark"
      state="saved"
      message="stashed to ~/bookmarks"
      time="just now"
      dismissLabel="Dismiss notification"
      onDismiss={() => {}}
      phase="entering"
      durationMs={3600}
      dataTestId="toast-reduced-motion"
    />
  </>
);

export const ReducedMotion: TStory = {
  render: () => <ReducedMotionDemo />,
};
