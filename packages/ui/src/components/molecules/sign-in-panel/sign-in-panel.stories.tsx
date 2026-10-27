import {
  ACCOUNT_BUTTON_STYLE,
  FORM_STATUS,
  ICONS,
  TOAST_TYPE,
} from '@blog/config';
import { buttonBusyVariants } from '@blog/ui/components/atoms/button/button-variants';
import { spinnerVariants } from '@blog/ui/components/atoms/spinner/spinner-variants';
import { AccountTrigger } from '@blog/ui/components/molecules/account-trigger';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { Toast } from '@blog/ui/components/molecules/toast';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { SignInPanel, type TSignInPanelProps } from './sign-in-panel';

const PANEL_ID = 'sign-in-panel';
const TRIGGER_LABELS = { signIn: 'Sign in', account: 'Account' };
const READER_EMAIL = 'sam@example.com';
const BUSY_STYLES = objectKeys(buttonBusyVariants.variants.busyStyle);
const SPINNER_VARIANTS = objectKeys(spinnerVariants.variants.variant);

const InteractiveSignInPanel = (args: TSignInPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [email, setEmail] = useState(args.emailForm.value);

  return (
    <PopoverMenu>
      <AccountTrigger
        appearance={ACCOUNT_BUTTON_STYLE.PILL}
        labels={TRIGGER_LABELS}
        isOpen={isOpen}
        panelId={PANEL_ID}
        onClick={() => setIsOpen((current) => !current)}
      />
      <SignInPanel
        {...args}
        panel={{ ...args.panel, isOpen }}
        emailForm={{ ...args.emailForm, value: email, onChange: setEmail }}
      />
    </PopoverMenu>
  );
};

const meta = {
  title: 'Molecules/SignInPanel',
  component: SignInPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="flex min-h-[520px] items-start justify-end p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    pendingProviderId: { control: 'select', options: ['github', 'google'] },
    busyStyle: { control: 'select', options: BUSY_STYLES },
    spinnerVariant: { control: 'select', options: SPINNER_VARIANTS },
  },
  args: {
    panel: { id: PANEL_ID, isOpen: true },
    labels: {
      title: 'Sign in',
      or: 'or',
      email: 'Email address',
      emailPlaceholder: 'you@example.com',
      submit: 'Email me a sign-in link',
      sending: 'Sending…',
      hint: 'You come back to this page afterwards.',
      sentTitle: 'Check your inbox',
      sentMessage: (
        <>
          We sent a sign-in link to <strong>{READER_EMAIL}</strong>.
        </>
      ),
      useDifferentEmail: 'Use a different email',
    },
    providers: [
      {
        id: 'github',
        icon: ICONS.GITHUB,
        label: 'Continue with GitHub',
        pendingLabel: 'Taking you to GitHub…',
        onSelect: fn(),
      },
      {
        id: 'google',
        icon: ICONS.GOOGLE,
        label: 'Continue with Google',
        pendingLabel: 'Taking you to Google…',
        onSelect: fn(),
      },
    ],
    emailForm: {
      value: '',
      onChange: fn(),
      onSubmit: fn(),
      onReset: fn(),
      status: FORM_STATUS.IDLE,
    },
    className: 'w-80',
  },
  render: (args) => <InteractiveSignInPanel {...args} />,
} satisfies Meta<typeof SignInPanel>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Open: TStory = {};

export const ProviderPressed: TStory = {
  args: { pendingProviderId: 'github' },
};

export const Sending: TStory = {
  args: {
    emailForm: {
      ...meta.args.emailForm,
      value: READER_EMAIL,
      status: FORM_STATUS.SUBMITTING,
    },
  },
};

export const SendingInEveryBusyStyle: TStory = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      {BUSY_STYLES.map((busyStyle) => (
        <SignInPanel
          key={busyStyle}
          {...args}
          busyStyle={busyStyle}
          emailForm={{
            ...args.emailForm,
            value: READER_EMAIL,
            status: FORM_STATUS.SUBMITTING,
          }}
        />
      ))}
    </div>
  ),
};

export const SendingInEverySpinnerStyle: TStory = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      {SPINNER_VARIANTS.map((spinnerVariant) => (
        <SignInPanel
          key={spinnerVariant}
          {...args}
          spinnerVariant={spinnerVariant}
          emailForm={{
            ...args.emailForm,
            value: READER_EMAIL,
            status: FORM_STATUS.SUBMITTING,
          }}
        />
      ))}
    </div>
  ),
};

export const ProviderPressedInEverySpinnerStyle: TStory = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      {SPINNER_VARIANTS.map((spinnerVariant) => (
        <SignInPanel
          key={spinnerVariant}
          {...args}
          pendingProviderId="github"
          spinnerVariant={spinnerVariant}
        />
      ))}
    </div>
  ),
};

export const Sent: TStory = {
  args: {
    emailForm: {
      ...meta.args.emailForm,
      value: READER_EMAIL,
      status: FORM_STATUS.SUCCESS,
    },
  },
};

export const CouldNotSend: TStory = {
  args: {
    emailForm: {
      ...meta.args.emailForm,
      value: READER_EMAIL,
      status: FORM_STATUS.ERROR,
      errorMessage: "Couldn't send the link. Try again.",
    },
  },
};

export const EmailOnly: TStory = {
  args: { providers: [] },
};

export const BackAfterFailedSignIn: TStory = {
  render: () => (
    <div className="flex w-80 flex-col items-end gap-2">
      <AccountTrigger
        appearance={ACCOUNT_BUTTON_STYLE.PILL}
        labels={TRIGGER_LABELS}
        isOpen={false}
        panelId={PANEL_ID}
      />
      <Toast
        type={TOAST_TYPE.ERROR}
        message="Sign-in failed. Please try again."
        action={{ label: 'Try again', onAct: fn() }}
        dismissLabel="Dismiss"
        onDismiss={fn()}
        phase="visible"
      />
    </div>
  ),
};
