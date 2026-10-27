import { CONSENT_CATEGORY } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentBannerSlot } from '@web/components/shared/consent-banner-slot';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
  readGrantedConsent,
} from '@web/testing/shared/consent/consent-cookie';
import {
  OPEN_PREFERENCES_BUTTON_NAME,
  OpenPreferencesButton,
} from '@web/testing/shared/consent/consent-preferences-probes';

import { ConsentPreferencesDialog } from './consent-preferences-dialog';

const DIALOG_NAME = 'Cookie settings';
const EXTERNAL_MEDIA_SWITCH_NAME = 'External media';
const SAVE_BUTTON_NAME = 'Save';

describe(`<${ConsentPreferencesDialog.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });

  afterEach(clearConsentCookie);

  const openPreferences = async () => {
    const openButton = screen.getByRole('button', {
      name: OPEN_PREFERENCES_BUTTON_NAME,
    });
    await user.click(openButton);
    await screen.findByRole('dialog', { name: DIALOG_NAME });
  };

  const renderDialogWithOpener = () => {
    renderElement(
      <>
        <OpenPreferencesButton />
        <ConsentPreferencesDialog />
      </>,
    );
  };

  it('stays closed until preferences are opened', () => {
    renderElement(<ConsentPreferencesDialog />);

    const dialog = screen.queryByRole('dialog');

    expect(dialog).not.toBeInTheDocument();
  });

  describe('when preferences are opened', () => {
    beforeEach(async () => {
      renderDialogWithOpener();
      await openPreferences();
    });

    it('opens as a dialog', () => {
      const dialog = screen.getByRole('dialog', { name: DIALOG_NAME });

      expect(dialog).toBeVisible();
    });

    it('shows necessary cookies as always on', () => {
      const necessarySwitch = screen.getByRole('switch', { name: 'Necessary' });

      expect(necessarySwitch).toBeChecked();
      expect(necessarySwitch).toBeDisabled();
    });

    it('shows external media off until it has been granted', () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });

      expect(externalMediaSwitch).not.toBeChecked();
    });

    it('saves the chosen categories and closes', async () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });

      await user.click(externalMediaSwitch);
      await user.click(saveButton);

      const dialog = screen.queryByRole('dialog');
      expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
      expect(dialog).not.toBeInTheDocument();
    });

    it('closes without saving from the close button', async () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      const closeButton = screen.getByRole('button', { name: 'Close' });

      await user.click(externalMediaSwitch);
      await user.click(closeButton);

      const dialog = screen.queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
      expect(readGrantedConsent()).toBeUndefined();
    });

    it('reopens with the stored choice rather than the discarded one', async () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(externalMediaSwitch);
      await user.click(closeButton);

      await openPreferences();

      const reopenedSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      expect(reopenedSwitch).not.toBeChecked();
    });
  });

  describe('when external media was already granted', () => {
    beforeEach(async () => {
      grantConsent();
      renderDialogWithOpener();
      await openPreferences();
    });

    it('shows external media on', () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });

      expect(externalMediaSwitch).toBeChecked();
    });

    it('saves a withdrawn category as declined', async () => {
      const externalMediaSwitch = screen.getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });

      await user.click(externalMediaSwitch);
      await user.click(saveButton);

      expect(readGrantedConsent()).toEqual([]);
    });
  });

  it('moves focus to the footer cookie settings button after banner save', async () => {
    renderElement(
      <>
        <ConsentBannerSlot isEnabled={true} />
        <CookieSettingsButton />
        <ConsentPreferencesDialog />
      </>,
    );
    const bannerSettingsButton = screen.getByRole('button', {
      name: 'Settings',
    });
    await user.click(bannerSettingsButton);
    const saveButton = await screen.findByRole('button', {
      name: SAVE_BUTTON_NAME,
    });

    await user.click(saveButton);

    const footerSettingsButton = await screen.findByRole('button', {
      name: DIALOG_NAME,
    });
    await waitFor(() => {
      expect(footerSettingsButton).toHaveFocus();
    });
  });
});
