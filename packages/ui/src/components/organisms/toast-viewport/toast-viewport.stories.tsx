import { TOAST_TYPE } from '@blog/config';
import { Toast, type IToast } from '@blog/ui/components/molecules/toast';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ToastViewport } from './toast-viewport';

const SAVED_TOAST: IToast = {
  type: TOAST_TYPE.SUCCESS,
  title: 'Saved',
  message: 'Stashed to your bookmarks.',
  time: 'just now',
  phase: 'visible',
  durationMs: 3600,
  action: { label: 'undo', onAct: () => {}, keyHint: '⌘Z' },
};

const DISMISS_LABEL = 'Dismiss notification';

const meta = {
  title: 'Organisms/ToastViewport',
  component: ToastViewport,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Notifications',
  },
} satisfies Meta<typeof ToastViewport>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const SingleToast: TStory = {
  args: {
    children: (
      <Toast
        toast={SAVED_TOAST}
        dismissLabel={DISMISS_LABEL}
        onDismiss={() => {}}
      />
    ),
  },
};

export const StackedToasts: TStory = {
  args: {
    children: (
      <>
        <Toast
          toast={{
            type: TOAST_TYPE.INFO,
            title: 'Recorded',
            message: 'Your rating saved — 4★.',
            time: '1m ago',
            phase: 'visible',
            durationMs: 3600,
          }}
          dismissLabel={DISMISS_LABEL}
          onDismiss={() => {}}
        />
        <Toast
          toast={{
            type: TOAST_TYPE.WARNING,
            title: 'Queued',
            message: 'Posted — awaiting review.',
            time: '12s ago',
            phase: 'visible',
            durationMs: 5000,
          }}
          dismissLabel={DISMISS_LABEL}
          onDismiss={() => {}}
        />
        <Toast
          toast={SAVED_TOAST}
          dismissLabel={DISMISS_LABEL}
          onDismiss={() => {}}
        />
      </>
    ),
  },
};

export const Empty: TStory = {};
