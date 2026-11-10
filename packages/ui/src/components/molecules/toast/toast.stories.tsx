import { TOAST_TYPE } from '@blog/config';
import { spinnerVariants } from '@blog/ui/components/atoms/spinner/spinner-variants';
import { ButtonShapes } from '@blog/ui/testing/button-shapes';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toast, type IToast } from './toast';

const SUCCESS_TOAST: IToast = {
  type: TOAST_TYPE.SUCCESS,
  title: 'Saved',
  message: 'Added to your bookmarks.',
  time: 'just now',
  phase: 'visible',
  durationMs: 3600,
};

const UNDO_ACTION: IToast['action'] = {
  label: 'undo',
  onAct: () => {},
  keyHint: '⌘Z',
};

const meta = {
  title: 'Molecules/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    spinnerVariant: {
      control: 'select',
      options: objectKeys(spinnerVariants.variants.variant),
    },
  },
  args: {
    toast: SUCCESS_TOAST,
    dismissLabel: 'Dismiss notification',
    onDismiss: () => {},
  },
} satisfies Meta<typeof Toast>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Success: TStory = {};

export const Info: TStory = {
  args: {
    toast: {
      ...SUCCESS_TOAST,
      type: TOAST_TYPE.INFO,
      title: 'Removed',
      message: 'Removed from your bookmarks.',
    },
  },
};

export const Warning: TStory = {
  args: {
    toast: {
      ...SUCCESS_TOAST,
      type: TOAST_TYPE.WARNING,
      title: 'Queued',
      message: 'Comment posted — awaiting review.',
      durationMs: 5000,
    },
  },
};

export const Error: TStory = {
  args: {
    toast: {
      ...SUCCESS_TOAST,
      type: TOAST_TYPE.ERROR,
      title: 'Failed',
      message: "Couldn't save — retry?",
      durationMs: undefined,
      action: { label: 'retry', onAct: () => {}, keyHint: 'R' },
    },
  },
};

export const Loading: TStory = {
  args: {
    toast: {
      ...SUCCESS_TOAST,
      type: TOAST_TYPE.INFO,
      isLoading: true,
      title: 'Saving',
      message: 'Hang on a moment…',
      time: undefined,
      durationMs: undefined,
    },
  },
};

export const LoadingInEverySpinnerStyle: TStory = {
  args: Loading.args,
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      {objectKeys(spinnerVariants.variants.variant).map((spinnerVariant) => (
        <Toast key={spinnerVariant} {...args} spinnerVariant={spinnerVariant} />
      ))}
    </div>
  ),
};

export const WithAction: TStory = {
  args: {
    toast: { ...SUCCESS_TOAST, action: UNDO_ACTION },
  },
};

export const Paused: TStory = {
  args: {
    toast: { ...SUCCESS_TOAST, action: UNDO_ACTION, paused: true },
  },
};

export const MessageOnly: TStory = {
  args: {
    toast: {
      ...SUCCESS_TOAST,
      title: undefined,
      message: 'Removed from bookmarks.',
    },
  },
};

const ReducedMotionDemo = () => (
  <>
    {/* Storybook cannot emulate `prefers-reduced-motion`, so this mirrors the component's `motion-reduce:` rules. */}
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
      toast={{ ...SUCCESS_TOAST, phase: 'entering' }}
      dismissLabel="Dismiss notification"
      onDismiss={() => {}}
      dataTestId="toast-reduced-motion"
    />
  </>
);

export const ReducedMotion: TStory = {
  render: () => <ReducedMotionDemo />,
};

export const ButtonShapesRow: TStory = {
  name: 'Button shapes',
  args: Error.args,
  render: (args) => <ButtonShapes>{() => <Toast {...args} />}</ButtonShapes>,
};
