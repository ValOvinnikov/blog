import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeContactFormModule } from '@web/testing/modules/contact-form/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { ContactFormModuleView } from './contact-form-module-view';

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
    id: 'contact-form-1',
    ...makeContactFormModule({
      headingBlock: {
        heading: 'Tell us about your project',
        supportingText: 'A few lines is enough. We reply within a working day.',
      },
      successMessage: "Thanks, we'll reply within a working day.",
      privacyNote: [portableTextBlock('We only use your details to reply.')],
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
