import {
  ACTION_OUTCOME,
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { TSubmitContactMessage } from '@web/modules/contact-form/hooks/use-contact-form/use-contact-form';
import { mockContactFormModule } from '@web/testing/modules/contact-form/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { ContactFormModuleView } from './contact-form-module-view';

type TSendOutcome =
  typeof ACTION_OUTCOME.SUCCESS | typeof ACTION_OUTCOME.SERVER_ERROR;

const sendAfter =
  (outcome: TSendOutcome): TSubmitContactMessage =>
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return { outcome };
  };

const meta = {
  title: 'Modules/ContactFormModule',
  component: ContactFormModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    id: faker.string.uuid(),
    currentLocale: LOCALE_ISO_CODES.EN,
    defaultLocale: LOCALE_ISO_CODES.EN,
    submitMessage: sendAfter(ACTION_OUTCOME.SUCCESS),
    ...mockContactFormModule({
      privacyNote: [mockPortableTextBlock(faker.lorem.sentence())],
    }),
  },
} satisfies Meta<typeof ContactFormModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const Centered: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const WithoutPrivacyNote: TStory = {
  args: { privacyNote: undefined },
};

export const SendFails: TStory = {
  args: { submitMessage: sendAfter(ACTION_OUTCOME.SERVER_ERROR) },
};
