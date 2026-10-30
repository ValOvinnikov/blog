import { CONSENT_CATEGORY } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { renderElement, screen, within } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
  readGrantedConsent,
} from '@web/testing/shared/consent/consent-cookie';
import {
  OPEN_PREFERENCES_BUTTON_NAME,
  OpenPreferencesButton,
} from '@web/testing/shared/consent/consent-preferences-probes';

import { CookieSettingsForm } from './cookie-settings-form';

const EXTERNAL_MEDIA_SWITCH_NAME = 'External media';
const SAVE_BUTTON_NAME = 'Save';
const SAVED_STATUS_TEXT = 'Your cookie settings are saved.';
const FORM_TEST_ID = 'cookie-settings-form';

describe(`<${CookieSettingsForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });

  afterEach(clearConsentCookie);

  const getFormExternalMediaSwitch = () =>
    within(screen.getByTestId(FORM_TEST_ID)).getByRole('switch', {
      name: EXTERNAL_MEDIA_SWITCH_NAME,
    });

  it('shows external media on for a reader who accepted it', () => {
    grantConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    renderElement(<CookieSettingsForm />);

    const externalMediaSwitch = getFormExternalMediaSwitch();

    expect(externalMediaSwitch).toBeChecked();
  });

  it('keeps the saved choice when saved without changes', async () => {
    grantConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    renderElement(<CookieSettingsForm />);
    const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });

    await user.click(saveButton);

    expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
  });

  it('saves the chosen categories', async () => {
    renderElement(<CookieSettingsForm />);
    const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });

    await user.click(getFormExternalMediaSwitch());
    await user.click(saveButton);

    expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    expect(getFormExternalMediaSwitch()).toBeChecked();
  });

  it('confirms a save in a status', async () => {
    renderElement(<CookieSettingsForm />);
    const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });

    await user.click(saveButton);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(SAVED_STATUS_TEXT);
  });

  it('clears the confirmation once a switch changes again', async () => {
    renderElement(<CookieSettingsForm />);
    const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });
    await user.click(saveButton);

    await user.click(getFormExternalMediaSwitch());

    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
  });

  it('shows the choice saved from the dialog on the same page', async () => {
    renderElement(
      <>
        <CookieSettingsForm />
        <OpenPreferencesButton />
        <ConsentPreferencesDialog />
      </>,
    );
    const openButton = screen.getByRole('button', {
      name: OPEN_PREFERENCES_BUTTON_NAME,
    });

    await user.click(openButton);
    const dialog = await screen.findByRole('dialog');
    const dialogSwitch = within(dialog).getByRole('switch', {
      name: EXTERNAL_MEDIA_SWITCH_NAME,
    });
    await user.click(dialogSwitch);
    const dialogSaveButton = within(dialog).getByRole('button', {
      name: SAVE_BUTTON_NAME,
    });
    await user.click(dialogSaveButton);

    expect(getFormExternalMediaSwitch()).toBeChecked();
  });
});
