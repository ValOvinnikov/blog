import { FORM_STATUS, CONTENT_ALIGNMENT, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { HEADING_LEVELS } from '@blog/ui/lib/react';
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
    status: {
      control: 'select',
      options: Object.values(FORM_STATUS),
    },
    headingLevel: {
      control: 'select',
      options: HEADING_LEVELS,
    },
  },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: FORM_STATUS.IDLE,
    heading: faker.lorem.words(3),
    headingId: 'newsletter-signup-full-heading',
    supportingText: faker.lorem.sentences(2),
    submitLabel: faker.lorem.word(),
    emailAriaLabel: faker.lorem.words(2),
    placeholder: faker.internet.email(),
    successMessage: faker.lorem.sentence(),
  },
} satisfies Meta<typeof NewsletterSignup.Full>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Submitting: TStory = {
  args: { status: FORM_STATUS.SUBMITTING, email: faker.internet.email() },
};

export const Success: TStory = {
  args: { status: FORM_STATUS.SUCCESS },
};

export const Error: TStory = {
  args: {
    status: FORM_STATUS.ERROR,
    email: faker.lorem.word(),
    errorMessage: faker.lorem.sentence(),
    errorMessageId: 'newsletter-signup-full-error',
  },
};

export const WithTrustCues: TStory = {
  args: { trustCues },
};

export const WithoutHeading: TStory = {
  args: { heading: undefined, supportingText: undefined, trustCues },
};

export const FormOnly: TStory = {
  args: { heading: undefined, supportingText: undefined },
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
