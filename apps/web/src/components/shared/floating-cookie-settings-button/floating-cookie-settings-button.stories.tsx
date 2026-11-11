import {
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';
import type { CSSProperties } from 'react';

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

export const UnderSquareHeaderControls: TStory = {
  decorators: [
    (Story) => (
      <div
        style={
          HEADER_CONTROL_SHAPE_DECLARATIONS[
            HEADER_CONTROL_SHAPE.SQUARE
          ] as CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};
