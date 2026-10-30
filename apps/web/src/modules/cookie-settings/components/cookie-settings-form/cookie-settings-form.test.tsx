import { CONSENT_CATEGORY } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { renderElement, screen, within } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import {
  clearConsentCookie,
  grantConsent,
  readGrantedConsent,
} from '@web/testing/shared/consent/consent-cookie';
import {
  OPEN_PREFERENCES_BUTTON_NAME,
  OpenPreferencesButton,
} from '@web/testing/shared/consent/consent-preferences-probes';
import { renderToString } from 'react-dom/server';

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

  it('shows no switches before the saved choice is known', () => {
    grantConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    document.body.innerHTML = renderToString(
      <AppProviders>
        <CookieSettingsForm />
      </AppProviders>,
    );

    const switches = screen.queryAllByRole('switch');

    expect(switches).toHaveLength(0);
  });

  it('confirms every save, even one that repeats the last', async () => {
    renderElement(<CookieSettingsForm />);
    const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });
    await user.click(saveButton);
    const firstConfirmation = screen.getByText(SAVED_STATUS_TEXT);

    await user.click(saveButton);

    const secondConfirmation = screen.getByText(SAVED_STATUS_TEXT);
    expect(firstConfirmation).not.toBeInTheDocument();
    expect(secondConfirmation).toBeVisible();
  });

  describe('when the dialog saves on the same page', () => {
    const saveExternalMediaFromDialog = async () => {
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
    };

    beforeEach(() => {
      grantConsent([]);
      renderElement(
        <>
          <CookieSettingsForm />
          <OpenPreferencesButton />
          <ConsentPreferencesDialog />
        </>,
      );
    });

    it('shows the choice saved from the dialog', async () => {
      await saveExternalMediaFromDialog();

      expect(getFormExternalMediaSwitch()).toBeChecked();
    });

    it('withdraws its own save confirmation', async () => {
      const formSaveButton = within(screen.getByTestId(FORM_TEST_ID)).getByRole(
        'button',
        { name: SAVE_BUTTON_NAME },
      );
      await user.click(formSaveButton);

      await saveExternalMediaFromDialog();

      const confirmation = screen.queryByText(SAVED_STATUS_TEXT);
      expect(confirmation).not.toBeInTheDocument();
    });

    it('drops changes the reader had not saved here', async () => {
      await user.click(getFormExternalMediaSwitch());
      const openButton = screen.getByRole('button', {
        name: OPEN_PREFERENCES_BUTTON_NAME,
      });
      await user.click(openButton);
      const dialog = await screen.findByRole('dialog');
      const dialogSaveButton = within(dialog).getByRole('button', {
        name: SAVE_BUTTON_NAME,
      });

      await user.click(dialogSaveButton);

      expect(getFormExternalMediaSwitch()).not.toBeChecked();
    });
  });
});
