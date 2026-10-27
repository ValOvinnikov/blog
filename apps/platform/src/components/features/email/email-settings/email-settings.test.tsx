import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import { faker } from '@faker-js/faker';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import en from '@platform/i18n/messages/en.json';
import { sendTestEmailAction } from '@platform/server/email/send-test-email-action';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  MOCK_CONTACT_RECIPIENT,
  MOCK_EMAIL_LOGO_URL,
  SEND_CONTACT_MESSAGES_TO,
  SEND_TEST_TO_ME,
} from '@platform/testing/email/fixtures';
import {
  mockEmailBody,
  mockEmailDraft,
  mockEmailSender,
  MOCK_EMAIL_DRAFT_LIVE_LOCALES,
  MOCK_EMAIL_DRAFT_SUBJECT,
} from '@platform/testing/email-draft';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  EMAIL_SENDER_ITEM,
  withCopy,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

faker.seed(5993);

const {
  updateEmailTemplateActionMock,
  updateEmailConfigActionMock,
  uploadEmailLogoActionMock,
} = vi.hoisted(() => ({
  updateEmailTemplateActionMock: vi.fn(),
  updateEmailConfigActionMock: vi.fn(),
  uploadEmailLogoActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/email-templates/update-email-template-action',
  () => ({ updateEmailTemplateAction: updateEmailTemplateActionMock }),
);

vi.mock('@platform/server/email-config/update-email-config-action', () => ({
  updateEmailConfigAction: updateEmailConfigActionMock,
}));

vi.mock('@platform/server/email/upload-email-logo-action', () => ({
  uploadEmailLogoAction: uploadEmailLogoActionMock,
}));

vi.mock('@platform/server/email/clear-email-logo-action', () => ({
  clearEmailLogoAction: vi.fn(),
}));

vi.mock('@platform/server/email/send-test-email-action');

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK, TENANT_INVITE } = EMAIL_TEMPLATE_TYPE;

const tForm = en.emailForm;
const tTemplate = en.emailTemplateEditor;
const tStatus = en.fieldStatus;
const tLanguagePicker = makeEnTranslator('languagePicker');
const tSaveBar = makeEnTranslator('saveBar');
const tDraftRecovery = makeEnTranslator('draftRecovery');
const { editTab: EDIT, previewTab: PREVIEW } = en.viewTabs;
const { EN: ENGLISH, FR: FRENCH } = en.languageNames;
const SENDER_NAME = en.emailSettingsForm.senderNameLabel;
const ARIA_SELECTED = 'aria-selected';

const fieldLabel = (label: string, locale: TLocaleIsoCode) =>
  label.replace('{language}', en.languageNames[locale]);
const SUBJECT_ENGLISH = fieldLabel(tTemplate.subjectLabel, EN);
const SUBJECT_FRENCH = fieldLabel(tTemplate.subjectLabel, FR);
const MESSAGE_ENGLISH = fieldLabel(tTemplate.bodyLabel, EN);
const RESTORE_ONE_CHANGE = tDraftRecovery('restore', { count: 1 });

const itemLabel = (item: TEmailPageItem) =>
  item === EMAIL_SENDER_ITEM
    ? tForm.senderItemLabel
    : tTemplate.templateTypeLabel[item];

const itemDescription = (item: TEmailPageItem) =>
  item === EMAIL_SENDER_ITEM
    ? tForm.senderItemDescription
    : tTemplate.templateTypeDescription[item];

const pickerText = (item: TEmailPageItem, status: string) =>
  item === EMAIL_SENDER_ITEM
    ? `${itemLabel(item)}${status}`
    : `${itemLabel(item)}${tForm.templateGroupLabel} · ${status}`;

const optionName = (item: TEmailPageItem, status: string) =>
  `${itemLabel(item)} ${itemDescription(item)}${status}`;

const MOCK_BRAND_NAME = faker.company.name();
const MOCK_FRENCH_SUBJECT = faker.lorem.words(2);
const MOCK_SENDER_NAME = faker.company.name();
const MOCK_INVALID_SENDER_NAME = faker.internet.email();
const MOCK_INVALID_CONTACT_RECIPIENT = faker.lorem.word();
const MOCK_SAVED_CONTACT_RECIPIENT = faker.internet.email();
const MOCK_RESTORED_MESSAGE = faker.lorem.sentence();
const MOCK_TYPED_CHARACTER = faker.string.alpha();
const MOCK_INITIAL_DRAFT = mockEmailDraft();
const BLANK_SENDER_INPUT = {
  senderName: null,
  replyToAddress: null,
  footerPostalAddress: null,
};

const setup = customRender(EmailSettings, {
  tenantId: MOCK_TENANT_ID,
  initialDraft: MOCK_INITIAL_DRAFT,
  defaultLocale: EN,
  liveLocales: MOCK_EMAIL_DRAFT_LIVE_LOCALES,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_BRAND_NAME,
});

const getEditingPicker = () =>
  screen.getByRole('combobox', { name: tForm.editingLabel });

const getSaveBar = () => screen.getByRole('region', { name: UNSAVED_CHANGES });

const openPicker = async (user: UserEvent) => {
  const editingPicker = getEditingPicker();
  await user.click(editingPicker);
  return screen.findByRole('listbox');
};

const openTemplate = async (user: UserEvent, item: TEmailTemplateType) => {
  const list = await openPicker(user);
  const option = within(list).getByRole('option', {
    name: new RegExp(`^${itemLabel(item)}`),
  });
  await user.click(option);
};

const chooseLanguage = (user: UserEvent, name: string) => {
  const languageButton = screen.getByRole('button', { name });
  return user.click(languageButton);
};

const typeFrenchSignInSubject = async (user: UserEvent) => {
  await openTemplate(user, MAGIC_LINK);
  await chooseLanguage(user, FRENCH);
  const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
  await user.type(frenchSubjectInput, MOCK_FRENCH_SUBJECT);
};

const save = async (user: UserEvent) => {
  const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
  await user.click(saveButton);
};

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    updateEmailTemplateActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    updateEmailConfigActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    uploadEmailLogoActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_EMAIL_LOGO_URL,
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  describe('with the default settings', () => {
    beforeEach(() => {
      setup();
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
      const languageGroup = screen.getByRole('group', {
        name: tLanguagePicker('ariaLabel'),
      });
      const englishButton = within(languageGroup).getByRole('button', {
        name: ENGLISH,
      });
      const frenchButton = within(languageGroup).getByRole('button', {
        name: FRENCH,
      });

      expect(englishButton).toHaveAccessibleDescription(
        tLanguagePicker('optionDescription', { isDefault: 'true', count: 1 }),
      );
      expect(frenchButton).toHaveAccessibleDescription(
        tLanguagePicker('optionDescription', { isDefault: 'false', count: 0 }),
      );

      await typeFrenchSignInSubject(user);

      const updatedFrenchButton = within(languageGroup).getByRole('button', {
        name: FRENCH,
      });

      expect(updatedFrenchButton).toHaveAccessibleDescription(
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

  describe('editing a template in two languages', () => {
    beforeEach(async () => {
      setup();
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

  describe('the sender logo', () => {
    beforeEach(async () => {
      setup();
      await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
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
      expect(logoTarget).toEqual({ type: 'tenant' });
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  describe('the save bar', () => {
    it('breaks the changes down so the parts add up to the total', async () => {
      setup();
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      await user.type(senderNameInput, MOCK_SENDER_NAME);
      await typeFrenchSignInSubject(user);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent(
        `${tSaveBar('unsavedChanges', { count: 2 })}${tForm.allLanguagesChanges} 1 · ${FRENCH} 1`,
      );
    });

    it('shows no language breakdown with one live language', async () => {
      setup({ liveLocales: [EN] });
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      await user.type(senderNameInput, MOCK_SENDER_NAME);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent(
        tSaveBar('unsavedChanges', { count: 1 }),
      );
      expect(saveBar).not.toHaveTextContent(tForm.allLanguagesChanges);
      expect(saveBar).not.toHaveTextContent(ENGLISH);
    });

    describe('when the sender name is rejected', () => {
      const goToFirstField = async () => {
        const saveBar = getSaveBar();
        const firstFieldLink = within(saveBar).getByRole('link', {
          name: GO_TO_THE_FIRST_ONE,
        });
        await user.click(firstFieldLink);
      };

      const saveAndSettle = async () => {
        await save(user);
        const barWithLink = getSaveBar();
        await within(barWithLink).findByRole('link', {
          name: GO_TO_THE_FIRST_ONE,
        });
        const barWithSave = getSaveBar();
        await within(barWithSave).findByRole('button', { name: SAVE_CHANGES });
      };

      beforeEach(async () => {
        updateEmailConfigActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            senderName: {
              reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID,
            },
          },
        });
        setup();
        const senderNameInput = screen.getByLabelText(SENDER_NAME);
        await user.type(senderNameInput, MOCK_INVALID_SENDER_NAME);
      });

      it('opens Sender & footer and focuses the sender name from a template', async () => {
        await openTemplate(user, MAGIC_LINK);
        const subjectInput = screen.getByLabelText(SUBJECT_ENGLISH);
        await user.type(subjectInput, MOCK_TYPED_CHARACTER);
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const senderNameInput = screen.getByLabelText(SENDER_NAME);
        const editingPicker = getEditingPicker();

        expect(senderNameInput).toHaveFocus();
        expect(editingPicker).toHaveTextContent(
          pickerText(EMAIL_SENDER_ITEM, tStatus.unsaved),
        );
      });

      it('returns to the Edit tab and focuses the sender name from the Preview', async () => {
        const previewTab = screen.getByRole('tab', { name: PREVIEW });
        await user.click(previewTab);
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const editTab = screen.getByRole('tab', { name: EDIT });
        const senderNameInput = screen.getByLabelText(SENDER_NAME);

        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
        expect(senderNameInput).toHaveFocus();
      });
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
      setup();

      const input = screen.getByLabelText(label);
      await user.type(input, typed);
      await save(user);

      const error = await screen.findByText(message);

      expect(error).toBeVisible();
    },
  );

  it('clears a saved contact recipient by saving it empty', async () => {
    setup({
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

  it('restores an unsaved translation after leaving the page, but not a staged logo', async () => {
    const { unmount } = setup();
    await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    await typeFrenchSignInSubject(user);
    unmount();

    setup();
    const restoreButton = screen.getByRole('button', {
      name: RESTORE_ONE_CHANGE,
    });
    await user.click(restoreButton);
    await openTemplate(user, MAGIC_LINK);
    await chooseLanguage(user, FRENCH);

    const restoredSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
    const list = await openPicker(user);
    const senderOption = within(list).getByRole('option', {
      name: optionName(EMAIL_SENDER_ITEM, tStatus.default),
    });

    expect(restoredSubjectInput).toHaveValue(MOCK_FRENCH_SUBJECT);
    expect(senderOption).toBeVisible();
  });

  it('shows a restored message in the template already open', async () => {
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'email' }),
      {
        values: withCopy(
          MOCK_INITIAL_DRAFT,
          { templateType: MAGIC_LINK, locale: EN },
          {
            subject: MOCK_EMAIL_DRAFT_SUBJECT,
            body: mockEmailBody(MOCK_RESTORED_MESSAGE),
          },
        ),
        baseline: MOCK_INITIAL_DRAFT,
        takenAt: new Date().toISOString(),
      },
    );
    setup();
    await openTemplate(user, MAGIC_LINK);

    const restoreButton = screen.getByRole('button', {
      name: RESTORE_ONE_CHANGE,
    });
    await user.click(restoreButton);

    const messageEditor = await screen.findByRole('textbox', {
      name: MESSAGE_ENGLISH,
    });

    expect(messageEditor).toHaveTextContent(MOCK_RESTORED_MESSAGE);
  });

  it('is read-only for an archived tenant', () => {
    setup({ archivedAt: MOCK_ARCHIVED_AT });

    expectArchivedOffersNoSave();
    const senderNameInput = screen.getByLabelText(SENDER_NAME);

    expect(senderNameInput).toBeDisabled();
  });
});
