import { TOAST_TYPE } from '@blog/config';
import { Toast } from '@blog/ui/molecules/toast';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ToastViewport } from './toast-viewport';

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
        type={TOAST_TYPE.SUCCESS}
        command="bookmark"
        state="saved"
        message="stashed to ~/bookmarks"
        time="just now"
        dismissLabel="Dismiss notification"
        onDismiss={() => {}}
        phase="visible"
        durationMs={3600}
        action={{ label: 'undo', onAct: () => {}, keyHint: '⌘Z' }}
      />
    ),
  },
};

export const StackedToasts: TStory = {
  args: {
    children: (
      <>
        <Toast
          type={TOAST_TYPE.INFO}
          command="rate"
          state="recorded"
          message="your rating saved — 4★"
          time="1m ago"
          dismissLabel="Dismiss notification"
          onDismiss={() => {}}
          phase="visible"
          durationMs={3600}
        />
        <Toast
          type={TOAST_TYPE.WARNING}
          command="comment"
          state="queued"
          message="posted — awaiting review"
          time="12s ago"
          dismissLabel="Dismiss notification"
          onDismiss={() => {}}
          phase="visible"
          durationMs={5000}
        />
        <Toast
          type={TOAST_TYPE.SUCCESS}
          command="bookmark"
          state="saved"
          message="stashed to ~/bookmarks"
          time="just now"
          dismissLabel="Dismiss notification"
          onDismiss={() => {}}
          phase="visible"
          durationMs={3600}
          action={{ label: 'undo', onAct: () => {}, keyHint: '⌘Z' }}
        />
      </>
    ),
  },
};

export const Empty: TStory = {};
