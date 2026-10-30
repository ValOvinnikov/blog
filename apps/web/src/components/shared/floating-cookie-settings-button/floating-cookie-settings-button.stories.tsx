import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';

import { FloatingCookieSettingsButton } from './floating-cookie-settings-button';

const meta = {
  title: 'Components/FloatingCookieSettingsButton',
  component: FloatingCookieSettingsButton,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    grantConsent();
    return clearConsentCookie;
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <ConsentPreferencesDialog />
      </>
    ),
  ],
} satisfies Meta<typeof FloatingCookieSettingsButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Answered: TStory = {};
