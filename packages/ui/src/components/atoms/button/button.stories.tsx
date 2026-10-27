import { SIZE } from '@blog/config';
import { spinnerVariants } from '@blog/ui/components/atoms/spinner/spinner-variants';
import { ReducedMotion } from '@blog/ui/testing/reduced-motion';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from 'storybook/test';

import { Button } from './button';
import { buttonBusyVariants, buttonVariants } from './button-variants';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(buttonVariants.variants.variant),
    },
    size: {
      control: 'select',
      options: objectKeys(buttonVariants.variants.size),
    },
    busyStyle: {
      control: 'select',
      options: objectKeys(buttonBusyVariants.variants.busyStyle),
    },
    spinnerVariant: {
      control: 'select',
      options: objectKeys(spinnerVariants.variants.variant),
    },
  },
};
export default meta;

type TStory = StoryObj<typeof Button>;

export const Primary: TStory = {
  args: { children: 'Publish', variant: 'primary', size: SIZE.MD },
};

export const Ghost: TStory = {
  args: { children: 'Cancel', variant: 'ghost' },
};

export const Link: TStory = {
  args: { children: 'Read more', variant: 'link' },
};

export const LinkDescendersAndWrapping: TStory = {
  name: 'Link — descenders and wrapping',
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="link">
        Display typography, spacing and quality guidelines
      </Button>
      <div className="max-w-48">
        <Button variant="link">
          Apply this styling quietly to every paragraph
        </Button>
      </div>
    </div>
  ),
};

const DANGER_LABEL = 'delete account';

export const Danger: TStory = {
  args: { children: DANGER_LABEL, variant: 'danger' },
};

export const DangerDisabled: TStory = {
  args: { children: DANGER_LABEL, variant: 'danger', isDisabled: true },
};

export const Small: TStory = {
  args: { children: 'Tag', size: SIZE.SM },
};

export const Large: TStory = {
  args: { children: 'Get started', size: SIZE.LG },
};

export const Disabled: TStory = {
  args: { children: 'Disabled', isDisabled: true },
};

const OnSecondary = () => (
  <div className="bg-secondary surface-secondary" style={{ padding: '1.5rem' }}>
    <Button variant="primary">Continue</Button>
  </div>
);

export const OnSecondaryBackgroundFocused: TStory = {
  name: 'On a Secondary background, focused',
  render: OnSecondary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button').focus();
  },
};

const OnBrandPrimary = () => (
  <div
    className="bg-brand-primary-muted surface-brand-primary"
    style={{ padding: '1.5rem' }}
  >
    <Button variant="primary">Continue</Button>
  </div>
);

export const OnBrandPrimaryBackgroundFocused: TStory = {
  name: 'On a Brand-primary background, focused',
  render: OnBrandPrimary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button').focus();
  },
};

export const Busy: TStory = {
  args: {
    children: 'Subscribe',
    busyLabel: 'Subscribing…',
    isBusy: true,
  },
};

const BUSY_STYLES = objectKeys(buttonBusyVariants.variants.busyStyle);
const BUTTON_VARIANTS = objectKeys(buttonVariants.variants.variant);
const SPINNER_VARIANTS = objectKeys(spinnerVariants.variants.variant);

const BusyStyles = () => (
  <div className="flex flex-col gap-4">
    {BUSY_STYLES.map((busyStyle) => (
      <div key={busyStyle} className="flex flex-wrap items-center gap-4">
        {BUTTON_VARIANTS.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            busyStyle={busyStyle}
            busyLabel="Sending…"
            isBusy={true}
          >
            Send
          </Button>
        ))}
        <Button busyStyle={busyStyle} busyLabel="Sending…">
          Send
        </Button>
      </div>
    ))}
  </div>
);

export const BusyStylesOnEveryVariant: TStory = {
  name: 'Busy styles on every variant, beside an idle button',
  render: () => <BusyStyles />,
};

export const BusyStylesWithReducedMotion: TStory = {
  name: 'Busy styles with reduced motion',
  render: () => (
    <ReducedMotion>
      <BusyStyles />
    </ReducedMotion>
  ),
};

export const SpinnersOnEveryVariant: TStory = {
  name: 'Each spinner on every variant',
  render: () => (
    <div className="flex flex-col gap-4">
      {SPINNER_VARIANTS.map((spinnerVariant) => (
        <div key={spinnerVariant} className="flex flex-wrap items-center gap-4">
          {BUTTON_VARIANTS.map((variant) => (
            <Button
              key={variant}
              variant={variant}
              spinnerVariant={spinnerVariant}
              busyLabel="Saving…"
              isBusy={true}
            >
              Save
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const BusyFocused: TStory = {
  name: 'Busy, focused',
  args: Busy.args,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button').focus();
  },
};
