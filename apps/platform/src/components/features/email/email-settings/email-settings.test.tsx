import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { ARIA_SELECTED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import {
  BLANK_SENDER_INPUT,
  cleanUpEmailSettings,
  EDIT,
  ENGLISH,
  FRENCH,
  getEditingPicker,
  openPicker,
  openTemplate,
  optionName,
  pickerText,
  prepareEmailSettings,
  PREVIEW,
  save,
  SENDER_NAME,
  setupEmailSettings,
  SUBJECT_ENGLISH,
  tStatus,
  typeFrenchSignInSubject,
  updateEmailConfigActionMock,
} from '@platform/testing/email/email-settings';
import {
  MOCK_CONTACT_RECIPIENT,
  SEND_CONTACT_MESSAGES_TO,
} from '@platform/testing/email/fixtures';
import { MOCK_EMAIL_DRAFT_SUBJECT } from '@platform/testing/email-draft';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import type { UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

vi.mock('@platform/server/email-templates/update-email-template-action');
vi.mock('@platform/server/email-config/update-email-config-action');
vi.mock('@platform/server/email/upload-email-logo-action');
vi.mock('@platform/server/email/clear-email-logo-action');
vi.mock('@platform/server/email/send-test-email-action');

const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;
const tLanguagePicker = makeEnTranslator('languagePicker');

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    ({ user } = prepareEmailSettings());
  });

  afterEach(cleanUpEmailSettings);

  describe('with the default settings', () => {
    beforeEach(() => {
      setupEmailSettings();
    });

    it('opens on Sender & footer, marking each template for the default language', async () => {
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      const editingPicker = getEditingPicker();

      expect(senderNameInput).toBeVisible();
      expect(editingPicker).toHaveTextContent(
        pickerText(EMAIL_SENDER_ITEM, tStatus.default),
      );

      const list = await openPicker(user);
      const signInOption = within(list).getByRole('option', {
        name: optionName(MAGIC_LINK, tStatus.customised),
      });
      const teamInviteOption = within(list).getByRole('option', {
        name: optionName(TENANT_INVITE, tStatus.default),
      });

      expect(signInOption).toBeVisible();
      expect(teamInviteOption).toBeVisible();
    });

    it('opens the email chosen from the picker in the editor', async () => {
      await openTemplate(user, MAGIC_LINK);

      const subjectInput = screen.getByLabelText(SUBJECT_ENGLISH);
      const senderNameInput = screen.queryByLabelText(SENDER_NAME);
      const editingPicker = getEditingPicker();

      expect(subjectInput).toHaveValue(MOCK_EMAIL_DRAFT_SUBJECT);
      expect(senderNameInput).not.toBeInTheDocument();
      expect(editingPicker).toHaveTextContent(
        pickerText(MAGIC_LINK, tStatus.customised),
      );
    });

    it('switches between the Edit and Preview tabs', async () => {
      const tablist = screen.getByRole('tablist', {
        name: en.viewTabs.ariaLabel,
      });
      const editTab = within(tablist).getByRole('tab', { name: EDIT });
      const previewTab = within(tablist).getByRole('tab', { name: PREVIEW });
      const editPanel = screen.getByRole('tabpanel', { name: EDIT });
      const senderNameInput = screen.getByLabelText(SENDER_NAME);

      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(editPanel).toContainElement(senderNameInput);

      await user.click(previewTab);

      const previewPanel = screen.getByRole('tabpanel', { name: PREVIEW });
      const previewRegion = screen.getByRole('region', {
        name: en.emailPreview.heading,
      });

      expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(previewPanel).toContainElement(previewRegion);
    });

    it("describes each language's customised templates in the language picker", async () => {
      const languageGroup = screen.getByRole('radiogroup', {
        name: tLanguagePicker('ariaLabel'),
      });
      const englishRadio = within(languageGroup).getByRole('radio', {
        name: ENGLISH,
      });
      const frenchRadio = within(languageGroup).getByRole('radio', {
        name: FRENCH,
      });

      expect(englishRadio).toHaveAccessibleDescription(
        tLanguagePicker('optionDescription', { isDefault: 'true', count: 1 }),
      );
      expect(frenchRadio).toHaveAccessibleDescription(
        tLanguagePicker('optionDescription', { isDefault: 'false', count: 0 }),
      );

      await typeFrenchSignInSubject(user);

      const updatedFrenchRadio = within(languageGroup).getByRole('radio', {
        name: FRENCH,
      });

      expect(updatedFrenchRadio).toHaveAccessibleDescription(
        tLanguagePicker('optionDescription', { isDefault: 'false', count: 1 }),
      );
    });

    it('saves the contact recipient the owner types', async () => {
      const contactRecipientInput = screen.getByLabelText(
        SEND_CONTACT_MESSAGES_TO,
      );
      await user.type(contactRecipientInput, MOCK_CONTACT_RECIPIENT);
      await save(user);

      await waitFor(() =>
        expect(updateEmailConfigActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          { ...BLANK_SENDER_INPUT, contactRecipient: MOCK_CONTACT_RECIPIENT },
        ),
      );
    });
  });

  it('is read-only for an archived tenant', () => {
    setupEmailSettings({
      tenant: mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    });

    expectArchivedOffersNoSave();
    const senderNameInput = screen.getByLabelText(SENDER_NAME);

    expect(senderNameInput).toBeDisabled();
  });
});
