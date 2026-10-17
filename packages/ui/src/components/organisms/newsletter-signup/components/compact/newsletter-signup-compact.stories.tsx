import { CONTENT_ALIGNMENT, FORM_STATUS } from '@blog/config';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

faker.seed(123);

const meta = {
  title: 'Organisms/NewsletterSignup/Compact',
  component: NewsletterSignup.Compact,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(FORM_STATUS),
    },
    align: {
      control: 'select',
      options: objectKeys(newsletterSignupVariants.variants.align),
    },
  },
  args: {
    email: '',
    onChange: () => {},
    onSubmit: () => {},
    status: FORM_STATUS.IDLE,
    heading: faker.lorem.words(2),
    headingId: 'newsletter-signup-compact-heading',
    prefix: <span aria-hidden="true">$</span>,
    submitLabel: faker.lorem.word(),
    emailAriaLabel: faker.lorem.words(2),
    placeholder: faker.internet.email(),
    successMessage: faker.lorem.sentence(),
  },
} satisfies Meta<typeof NewsletterSignup.Compact>;

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
    errorMessageId: 'newsletter-signup-compact-error',
  },
};

export const WithoutPrefix: TStory = {
  args: { prefix: undefined },
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

export const WithoutHeading: TStory = {
  args: { heading: undefined, prefix: undefined },
};
