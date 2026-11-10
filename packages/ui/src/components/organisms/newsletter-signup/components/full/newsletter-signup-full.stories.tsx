import { FORM_STATUS, CONTENT_ALIGNMENT, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { BUSY_STYLES, SPINNER_VARIANTS } from '@blog/ui/testing/busy-styles';
import { makeNewsletterSignupForm } from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

faker.seed(123);

const trustCues = [
  {
    icon: <Icon name={ICONS.SHIELD_CHECK} size={SIZE.SM} />,
    label: faker.lorem.words(2),
  },
  {
    icon: <Icon name={ICONS.CLOSE} size={SIZE.SM} />,
    label: faker.lorem.words(3),
  },
];

const placeholder = faker.internet.email();

const meta = {
  title: 'Organisms/NewsletterSignup/Full',
  component: NewsletterSignup.Full,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.align),
    },
  },
  args: {
    supportingText: faker.lorem.sentences(2),
    children: makeNewsletterSignupForm({ placeholder }),
  },
} satisfies Meta<typeof NewsletterSignup.Full>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Submitting: TStory = {
  args: {
    children: makeNewsletterSignupForm({
      status: FORM_STATUS.SUBMITTING,
      email: faker.internet.email(),
    }),
  },
};

export const SubmittingInEveryBusyStyle: TStory = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {BUSY_STYLES.map((busyStyle) => (
        <NewsletterSignup.Full key={busyStyle} {...args}>
          {makeNewsletterSignupForm({
            email: faker.internet.email(),
            status: FORM_STATUS.SUBMITTING,
            busyStyle,
          })}
        </NewsletterSignup.Full>
      ))}
    </div>
  ),
};

export const SubmittingInEverySpinnerStyle: TStory = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {SPINNER_VARIANTS.map((spinnerVariant) => (
        <NewsletterSignup.Full key={spinnerVariant} {...args}>
          {makeNewsletterSignupForm({
            email: faker.internet.email(),
            status: FORM_STATUS.SUBMITTING,
            spinnerVariant,
          })}
        </NewsletterSignup.Full>
      ))}
    </div>
  ),
};

export const Success: TStory = {
  args: { children: makeNewsletterSignupForm({ status: FORM_STATUS.SUCCESS }) },
};

export const Error: TStory = {
  args: {
    children: makeNewsletterSignupForm({
      status: FORM_STATUS.ERROR,
      email: faker.lorem.word(),
      errorMessage: faker.lorem.sentence(),
    }),
  },
};

export const WithTrustCues: TStory = {
  args: { trustCues },
};

export const WithoutSupportingText: TStory = {
  args: { supportingText: undefined, trustCues },
};

export const FormOnly: TStory = {
  args: { supportingText: undefined },
};

export const Centered: TStory = {
  args: { align: CONTENT_ALIGNMENT.CENTER, trustCues },
};

export const RightAligned: TStory = {
  args: { align: CONTENT_ALIGNMENT.RIGHT, trustCues },
};

export const MobilePhone: TStory = {
  globals: { viewport: 'phone' },
  args: { trustCues },
};

export const NarrowContainer: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-prose">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const SidebarColumn: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-[37.5rem]">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const SidebarColumnError: TStory = {
  decorators: SidebarColumn.decorators,
  args: {
    ...Error.args,
    trustCues,
  },
};

export const WideContainer: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const BrandPrimaryBand: TStory = {
  decorators: [
    (Story) => (
      <div className="surface-brand-primary bg-brand-primary-muted p-8">
        <Story />
      </div>
    ),
  ],
  args: { trustCues },
};

export const DarkTheme: TStory = {
  globals: { theme: 'dark' },
  args: { trustCues },
};
