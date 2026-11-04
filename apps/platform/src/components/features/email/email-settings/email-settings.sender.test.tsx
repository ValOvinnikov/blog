import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import en from '@platform/i18n/messages/en.json';
import { screen, waitFor } from '@platform/testing/custom-render';
import {
  BLANK_SENDER_INPUT,
  cleanUpEmailSettings,
  getEditingPicker,
  MOCK_INITIAL_DRAFT,
  MOCK_INVALID_SENDER_NAME,
  pickerText,
  prepareEmailSettings,
  save,
  selectSenderLogo,
  SENDER_NAME,
  setupEmailSettings,
  tStatus,
  updateEmailConfigActionMock,
  uploadEmailLogoActionMock,
} from '@platform/testing/email/email-settings';
import {
  MOCK_TENANT_LOGO_TARGET,
  SEND_CONTACT_MESSAGES_TO,
} from '@platform/testing/email/fixtures';
import { mockEmailSender } from '@platform/testing/email-draft';
import { SAVE_CHANGES } from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import type { UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

faker.seed(5994);

vi.mock('@platform/server/email-templates/update-email-template-action');
vi.mock('@platform/server/email-config/update-email-config-action');
vi.mock('@platform/server/email/upload-email-logo-action');
vi.mock('@platform/server/email/clear-email-logo-action');
vi.mock('@platform/server/email/send-test-email-action');

const MOCK_INVALID_CONTACT_RECIPIENT = faker.lorem.word();
const MOCK_SAVED_CONTACT_RECIPIENT = faker.internet.email();

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    ({ user } = prepareEmailSettings());
  });

  afterEach(cleanUpEmailSettings);

  describe('the sender logo', () => {
    beforeEach(async () => {
      setupEmailSettings();
      await selectSenderLogo();
    });

    it('is not uploaded when picked', async () => {
      await waitFor(() => {
        const editingPicker = getEditingPicker();

        expect(editingPicker).toHaveTextContent(
          pickerText(EMAIL_SENDER_ITEM, tStatus.unsaved),
        );
      });
      expect(uploadEmailLogoActionMock).not.toHaveBeenCalled();
    });

    it('is uploaded on Save', async () => {
      const saveButton = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveButton);

      await waitFor(() => expect(uploadEmailLogoActionMock).toHaveBeenCalled());
      const [tenantId, logoTarget, formData] =
        uploadEmailLogoActionMock.mock.lastCall ?? [];

      expect(tenantId).toBe(MOCK_TENANT_ID);
      expect(logoTarget).toEqual(MOCK_TENANT_LOGO_TARGET);
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  it.each([
    {
      label: SENDER_NAME,
      typed: MOCK_INVALID_SENDER_NAME,
      fieldErrors: {
        senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
      },
      message: en.emailSettingsForm.errors.senderNameInvalid,
    },
    {
      label: SEND_CONTACT_MESSAGES_TO,
      typed: MOCK_INVALID_CONTACT_RECIPIENT,
      fieldErrors: {
        contactRecipient: {
          reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
        },
      },
      message: en.emailSettingsForm.errors.contactRecipientInvalid,
    },
  ])(
    'shows the error the save returns for $label',
    async ({ label, typed, fieldErrors, message }) => {
      updateEmailConfigActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors,
      });
      setupEmailSettings();

      const input = screen.getByLabelText(label);
      await user.type(input, typed);
      await save(user);

      const error = await screen.findByText(message);

      expect(error).toBeVisible();
    },
  );

  it('clears a saved contact recipient by saving it empty', async () => {
    setupEmailSettings({
      initialDraft: {
        ...MOCK_INITIAL_DRAFT,
        sender: mockEmailSender({
          contactRecipient: MOCK_SAVED_CONTACT_RECIPIENT,
        }),
      },
    });

    const contactRecipientInput = screen.getByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );
    await user.clear(contactRecipientInput);
    await save(user);

    await waitFor(() =>
      expect(updateEmailConfigActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        ...BLANK_SENDER_INPUT,
        contactRecipient: null,
      }),
    );
  });
});
