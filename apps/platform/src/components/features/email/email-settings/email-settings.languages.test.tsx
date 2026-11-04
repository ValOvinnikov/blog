import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import en from '@platform/i18n/messages/en.json';
import { sendTestEmailAction } from '@platform/server/email/send-test-email-action';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';
import { screen, waitFor } from '@platform/testing/custom-render';
import {
  BLANK_SENDER_INPUT,
  chooseLanguage,
  cleanUpEmailSettings,
  ENGLISH,
  FRENCH,
  getEditingPicker,
  MOCK_FRENCH_SUBJECT,
  pickerText,
  prepareEmailSettings,
  save,
  setupEmailSettings,
  SUBJECT_FRENCH,
  tForm,
  tSaveBar,
  tStatus,
  typeFrenchSignInSubject,
  updateEmailConfigActionMock,
  updateEmailTemplateActionMock,
} from '@platform/testing/email/email-settings';
import { SEND_TEST_TO_ME } from '@platform/testing/email/fixtures';
import { MOCK_EMAIL_DRAFT_SUBJECT } from '@platform/testing/email-draft';
import type { mockRouterRefresh } from '@platform/testing/mock-router';
import { SAVE_CHANGES } from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

vi.mock('@platform/server/email-templates/update-email-template-action');
vi.mock('@platform/server/email-config/update-email-config-action');
vi.mock('@platform/server/email/upload-email-logo-action');
vi.mock('@platform/server/email/clear-email-logo-action');
vi.mock('@platform/server/email/send-test-email-action');

const { MAGIC_LINK } = EMAIL_TEMPLATE_TYPE;
const { FR } = LOCALE_ISO_CODES;

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    ({ user, refresh } = prepareEmailSettings());
  });

  afterEach(cleanUpEmailSettings);

  describe('editing a template in two languages', () => {
    beforeEach(async () => {
      setupEmailSettings();
      await typeFrenchSignInSubject(user);
    });

    it('falls back to the default-language subject in another language', async () => {
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      await user.clear(frenchSubjectInput);

      const clearedSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);

      expect(clearedSubjectInput).toHaveAttribute(
        'placeholder',
        MOCK_EMAIL_DRAFT_SUBJECT,
      );
    });

    it('keeps the edit across a language switch and marks the template unsaved', async () => {
      await chooseLanguage(user, ENGLISH);
      await chooseLanguage(user, FRENCH);

      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      const editingPicker = getEditingPicker();

      expect(frenchSubjectInput).toHaveValue(MOCK_FRENCH_SUBJECT);
      expect(editingPicker).toHaveTextContent(
        pickerText(MAGIC_LINK, tStatus.unsaved),
      );
    });

    it('saves only the language that changed', async () => {
      await save(user);

      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(updateEmailTemplateActionMock).toHaveBeenCalledTimes(1);
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MAGIC_LINK,
        FR,
        { subject: MOCK_FRENCH_SUBJECT, body: null },
      );
      expect(updateEmailConfigActionMock).not.toHaveBeenCalled();
    });

    it('restores the saved copy on Discard', async () => {
      const discardButton = screen.getByRole('button', {
        name: tSaveBar('discard'),
      });
      await user.click(discardButton);

      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });

      expect(frenchSubjectInput).toHaveValue('');
      expect(saveButton).not.toBeInTheDocument();
    });

    it('keeps the edit unsaved when the save fails', async () => {
      updateEmailTemplateActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await save(user);

      const failure = await screen.findByText(tForm.alertError);
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);

      expect(failure).toBeVisible();
      expect(frenchSubjectInput).toHaveValue(MOCK_FRENCH_SUBJECT);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('previews the edited subject and sends it as a test', async () => {
      const previewRegion = screen.getByRole('region', {
        name: en.emailPreview.heading,
      });

      expect(previewRegion).toHaveTextContent(MOCK_FRENCH_SUBJECT);

      const sendTestButton = screen.getByRole('button', {
        name: SEND_TEST_TO_ME,
      });
      await user.click(sendTestButton);

      const confirmation = await screen.findByText(
        en.emailPreview.testSent.replace('{email}', MOCK_ADMIN_EMAIL),
      );

      expect(confirmation).toBeVisible();
      expect(sendTestEmailAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        templateType: MAGIC_LINK,
        copy: {
          subject: MOCK_FRENCH_SUBJECT,
          body: EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[FR][MAGIC_LINK].body,
        },
        sender: BLANK_SENDER_INPUT,
      });
    });
  });
});
