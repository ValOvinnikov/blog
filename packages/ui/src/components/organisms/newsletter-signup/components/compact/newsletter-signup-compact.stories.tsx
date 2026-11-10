import {
  CONTENT_ALIGNMENT,
  FORM_STATUS,
  NEWSLETTER_VARIANT,
} from '@blog/config';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { BUSY_STYLES, SPINNER_VARIANTS } from '@blog/ui/testing/busy-styles';
import { makeNewsletterSignupForm } from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

faker.seed(123);

const placeholder = faker.internet.email();

const meta = {
  title: 'Organisms/NewsletterSignup/Compact',
  component: NewsletterSignup.Compact,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.align),
    },
  },
  args: {
    children: makeNewsletterSignupForm({
      variant: NEWSLETTER_VARIANT.COMPACT,
      placeholder,
    }),
  },
} satisfies Meta<typeof NewsletterSignup.Compact>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Submitting: TStory = {
  args: {
    children: makeNewsletterSignupForm({
      variant: NEWSLETTER_VARIANT.COMPACT,
      status: FORM_STATUS.SUBMITTING,
      email: faker.internet.email(),
    }),
  },
};

export const SubmittingInEveryBusyStyle: TStory = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {BUSY_STYLES.map((busyStyle) => (
        <NewsletterSignup.Compact key={busyStyle} {...args}>
          {makeNewsletterSignupForm({
            variant: NEWSLETTER_VARIANT.COMPACT,
            email: faker.internet.email(),
            status: FORM_STATUS.SUBMITTING,
            busyStyle,
          })}
        </NewsletterSignup.Compact>
      ))}
    </div>
  ),
};

export const SubmittingInEverySpinnerStyle: TStory = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {SPINNER_VARIANTS.map((spinnerVariant) => (
        <NewsletterSignup.Compact key={spinnerVariant} {...args}>
          {makeNewsletterSignupForm({
            variant: NEWSLETTER_VARIANT.COMPACT,
            email: faker.internet.email(),
            status: FORM_STATUS.SUBMITTING,
            spinnerVariant,
          })}
        </NewsletterSignup.Compact>
      ))}
    </div>
  ),
};

export const Success: TStory = {
  args: {
    children: makeNewsletterSignupForm({
      variant: NEWSLETTER_VARIANT.COMPACT,
      status: FORM_STATUS.SUCCESS,
    }),
  },
};

export const Error: TStory = {
  args: {
    children: makeNewsletterSignupForm({
      variant: NEWSLETTER_VARIANT.COMPACT,
      status: FORM_STATUS.ERROR,
      email: faker.lorem.word(),
      errorMessage: faker.lorem.sentence(),
    }),
  },
};

export const Centered: TStory = {
  args: { align: CONTENT_ALIGNMENT.CENTER },
};

export const RightAligned: TStory = {
  args: { align: CONTENT_ALIGNMENT.RIGHT },
};

export const BrandPrimaryBand: TStory = {
  decorators: [
    (Story) => (
      <div className="surface-brand-primary bg-brand-primary-muted p-8">
        <Story />
      </div>
    ),
  ],
};

export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
  decorators: [
    (Story) => (
      <div className="border border-dashed border-brand-primary">
        <Story />
      </div>
    ),
  ],
};
