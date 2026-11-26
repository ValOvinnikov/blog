import { CONSENT_CATEGORY, SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import {
  customRender,
  renderElement,
  screen,
  within,
} from '@web/testing/custom-render';
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

const { label: EXTERNAL_MEDIA_SWITCH_NAME } =
  SITE_MESSAGES.consent.categories.externalMedia;
const { saveLabel: SAVE_BUTTON_NAME, savedStatus: SAVED_STATUS_TEXT } =
  SITE_MESSAGES.consent.preferences;
const FORM_TEST_ID = 'cookie-settings-form';

const setup = customRender(CookieSettingsForm, {});

describe(`<${CookieSettingsForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });

  afterEach(clearConsentCookie);

  const getForm = () => screen.getByTestId(FORM_TEST_ID);

  const getFormExternalMediaSwitch = () => {
    const form = getForm();
    return within(form).getByRole('switch', {
      name: EXTERNAL_MEDIA_SWITCH_NAME,
    });
  };

  describe('for a reader who accepted external media', () => {
    beforeEach(() => {
      grantConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    });

    describe('in the server-rendered markup', () => {
      beforeEach(() => {
        document.body.innerHTML = renderToString(
          <AppProviders>
            <CookieSettingsForm />
          </AppProviders>,
        );
      });

      afterEach(() => {
        document.body.innerHTML = '';
      });

      it('shows no switches before the saved choice is known', () => {
        const switches = screen.queryAllByRole('switch');

        expect(switches).toHaveLength(0);
      });
    });

    describe('once rendered', () => {
      beforeEach(() => {
        setup();
      });

      it('shows external media on', () => {
        const externalMediaSwitch = getFormExternalMediaSwitch();

        expect(externalMediaSwitch).toBeChecked();
      });

      it('keeps the saved choice when saved without changes', async () => {
        const saveButton = screen.getByRole('button', {
          name: SAVE_BUTTON_NAME,
        });

        await user.click(saveButton);

        expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
      });
    });
  });

  describe('for a reader with no saved choice', () => {
    let saveButton: HTMLElement;

    beforeEach(() => {
      setup();
      saveButton = screen.getByRole('button', { name: SAVE_BUTTON_NAME });
    });

    it('saves the chosen categories', async () => {
      const externalMediaSwitch = getFormExternalMediaSwitch();

      await user.click(externalMediaSwitch);
      await user.click(saveButton);

      const savedSwitch = getFormExternalMediaSwitch();
      expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
      expect(savedSwitch).toBeChecked();
    });

    describe('after a save', () => {
      beforeEach(async () => {
        await user.click(saveButton);
      });

      it('confirms the save in a status', () => {
        const status = screen.getByRole('status');

        expect(status).toHaveTextContent(SAVED_STATUS_TEXT);
      });

      it('clears the confirmation once a switch changes again', async () => {
        const externalMediaSwitch = getFormExternalMediaSwitch();

        await user.click(externalMediaSwitch);

        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();
      });

      it('confirms every save, even one that repeats the last', async () => {
        const firstConfirmation = screen.getByText(SAVED_STATUS_TEXT);

        await user.click(saveButton);

        const secondConfirmation = screen.getByText(SAVED_STATUS_TEXT);
        expect(firstConfirmation).not.toBeInTheDocument();
        expect(secondConfirmation).toBeVisible();
      });
    });
  });

  describe('when the dialog saves on the same page', () => {
    const openDialog = async () => {
      const openButton = screen.getByRole('button', {
        name: OPEN_PREFERENCES_BUTTON_NAME,
      });
      await user.click(openButton);
      return screen.findByRole('dialog');
    };

    const saveFromDialog = async (dialog: HTMLElement) => {
      const dialogSaveButton = within(dialog).getByRole('button', {
        name: SAVE_BUTTON_NAME,
      });
      await user.click(dialogSaveButton);
    };

    const saveExternalMediaFromDialog = async () => {
      const dialog = await openDialog();
      const dialogSwitch = within(dialog).getByRole('switch', {
        name: EXTERNAL_MEDIA_SWITCH_NAME,
      });
      await user.click(dialogSwitch);
      await saveFromDialog(dialog);
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

      const externalMediaSwitch = getFormExternalMediaSwitch();
      expect(externalMediaSwitch).toBeChecked();
    });

    it('withdraws its own save confirmation', async () => {
      const form = getForm();
      const formSaveButton = within(form).getByRole('button', {
        name: SAVE_BUTTON_NAME,
      });
      await user.click(formSaveButton);

      await saveExternalMediaFromDialog();

      const confirmation = screen.queryByText(SAVED_STATUS_TEXT);
      expect(confirmation).not.toBeInTheDocument();
    });

    it('drops changes the reader had not saved here', async () => {
      const externalMediaSwitch = getFormExternalMediaSwitch();
      await user.click(externalMediaSwitch);
      const dialog = await openDialog();

      await saveFromDialog(dialog);

      const reloadedSwitch = getFormExternalMediaSwitch();
      expect(reloadedSwitch).not.toBeChecked();
    });
  });
});
