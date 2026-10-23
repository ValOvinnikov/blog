import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
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
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_EMAIL_BRAND as BRAND } from '@platform/testing/tenant-email-brand';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  buildEmailDraft,
  withCopy,
} from '@platform/utils/email-draft/email-draft';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

const {
  updateEmailTemplateActionMock,
  updateEmailConfigActionMock,
  uploadEmailLogoActionMock,
  clearEmailLogoActionMock,
  sendTestEmailActionMock,
} = vi.hoisted(() => ({
  sendTestEmailActionMock: vi.fn(),
  updateEmailTemplateActionMock: vi.fn(),
  updateEmailConfigActionMock: vi.fn(),
  uploadEmailLogoActionMock: vi.fn(),
  clearEmailLogoActionMock: vi.fn(),
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
  clearEmailLogoAction: clearEmailLogoActionMock,
}));

vi.mock('@platform/server/email/send-test-email-action', () => ({
  sendTestEmailAction: sendTestEmailActionMock,
}));

const { EN, FR } = LOCALE_ISO_CODES;
const LIVE_LOCALES = [EN, FR];

const SIGN_IN_TO_ACME = 'Sign in to Acme';

const INITIAL_DRAFT = buildEmailDraft({
  sender: {
    senderName: '',
    replyToAddress: '',
    footerPostalAddress: '',
    contactRecipient: '',
  },
  senderLogoUrl: undefined,
  authored: [
    {
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: EN,
      subject: SIGN_IN_TO_ACME,
      body: null,
    },
  ],
  templateLogoUrls: {
    MAGIC_LINK: undefined,
    TENANT_INVITE: undefined,
    NEWSLETTER_CONFIRMATION: undefined,
  },
  liveLocales: LIVE_LOCALES,
});

const setup = customRender(EmailSettings, {
  tenantId: MOCK_TENANT_ID,
  initialDraft: INITIAL_DRAFT,
  defaultLocale: EN,
  liveLocales: LIVE_LOCALES,
  brand: BRAND,
  brandName: 'Acme Co',
});

const getEditingPicker = () =>
  screen.getByRole('combobox', { name: 'Editing' });

const openPicker = async (user: UserEvent) => {
  const editingPicker = getEditingPicker();
  await user.click(editingPicker);
  return screen.findByRole('listbox');
};

const openSignInTemplate = async (user: UserEvent) => {
  const list = await openPicker(user);
  const signInOption = within(list).getByRole('option', {
    name: /^Sign-in link/,
  });
  await user.click(signInOption);
};

const chooseLanguage = (user: UserEvent, name: string) => {
  const languageButton = screen.getByRole('button', { name });
  return user.click(languageButton);
};

const SENDER_NAME = 'Sender name';
const SUBJECT_ENGLISH = 'Subject (English)';
const ARIA_SELECTED = 'aria-selected';
const SUBJECT_FRENCH = 'Subject (French)';
const WELCOME_BACK = 'Welcome back';
const FRENCH_SUBJECT = 'Connexion';
const TYPED_SENDER_NAME = 'Acme';
const INVALID_SENDER_NAME = 'a@b';
const SAVED_CONTACT_RECIPIENT = 'a@acme.example';
const RESTORE_CHANGES_NAME = /^Restore \d+ changes?$/;
const BLANK_SENDER_INPUT = {
  senderName: null,
  replyToAddress: null,
  footerPostalAddress: null,
};

const getSaveBar = () => screen.getByRole('region', { name: UNSAVED_CHANGES });

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    updateEmailTemplateActionMock.mockReset();
    updateEmailTemplateActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    updateEmailConfigActionMock.mockReset();
    updateEmailConfigActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    uploadEmailLogoActionMock.mockReset();
    clearEmailLogoActionMock.mockReset();
    sendTestEmailActionMock.mockReset();
    sendTestEmailActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      to: MOCK_ADMIN_EMAIL,
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

    it('opens on Sender & footer, with each template marked for the default language', async () => {
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      const editingPicker = getEditingPicker();

      expect(senderNameInput).toBeVisible();
      expect(editingPicker).toHaveTextContent(/^Sender & footer/);

      const list = await openPicker(user);
      const signInOption = within(list).getByRole('option', {
        name: /^Sign-in link.*Customised$/,
      });
      const teamInviteOption = within(list).getByRole('option', {
        name: /^Team invite.*Default$/,
      });

      expect(signInOption).toBeVisible();
      expect(teamInviteOption).toBeVisible();
    });

    it('opens the email chosen from the picker in the editor', async () => {
      await openSignInTemplate(user);

      const subjectInput = screen.getByLabelText(SUBJECT_ENGLISH);
      const senderNameInput = screen.queryByLabelText(SENDER_NAME);
      const editingPicker = getEditingPicker();

      expect(subjectInput).toHaveValue(SIGN_IN_TO_ACME);
      expect(senderNameInput).not.toBeInTheDocument();
      expect(editingPicker).toHaveTextContent(
        'Sign-in linkTemplate · Customised',
      );
    });

    it('switches between the Edit and Preview tabs', async () => {
      const tablist = screen.getByRole('tablist', { name: 'Edit or preview' });
      const editTab = within(tablist).getByRole('tab', { name: 'Edit' });
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      const editPanel = screen.getByRole('tabpanel', { name: 'Edit' });
      const senderNameInput = screen.getByLabelText(SENDER_NAME);

      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(editPanel).toContainElement(senderNameInput);

      await user.click(previewTab);

      const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
      const previewRegion = screen.getByRole('region', { name: 'Preview' });

      expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(previewPanel).toContainElement(previewRegion);
    });

    it("shows the language picker on Sender & footer, describing each language's customised templates", async () => {
      const languageGroup = screen.getByRole('group', { name: 'Language' });
      const englishButton = within(languageGroup).getByRole('button', {
        name: 'English',
      });
      const frenchButton = within(languageGroup).getByRole('button', {
        name: 'French',
      });

      expect(englishButton).toHaveAccessibleDescription(
        'Default language · 1 customised',
      );
      expect(frenchButton).toHaveAccessibleDescription('All default');

      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      await user.type(frenchSubjectInput, FRENCH_SUBJECT);

      const updatedFrenchButton = within(languageGroup).getByRole('button', {
        name: 'French',
      });

      expect(updatedFrenchButton).toHaveAccessibleDescription('1 customised');
    });

    it('saves the contact recipient the owner types', async () => {
      const contactRecipientInput = screen.getByLabelText(
        SEND_CONTACT_MESSAGES_TO,
      );
      await user.type(contactRecipientInput, MOCK_CONTACT_RECIPIENT);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await waitFor(() =>
        expect(updateEmailConfigActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          {
            ...BLANK_SENDER_INPUT,
            contactRecipient: MOCK_CONTACT_RECIPIENT,
          },
        ),
      );
    });
  });

  describe('editing a template in two languages', () => {
    beforeEach(async () => {
      setup();
      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      await user.type(frenchSubjectInput, FRENCH_SUBJECT);
    });

    it('falls back to the default-language subject in another language', async () => {
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      await user.clear(frenchSubjectInput);

      const clearedSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);

      expect(clearedSubjectInput).toHaveAttribute(
        'placeholder',
        SIGN_IN_TO_ACME,
      );
    });

    it('keeps the edit across a language switch and marks the template unsaved', async () => {
      await chooseLanguage(user, 'English');
      await chooseLanguage(user, 'French');

      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      const editingPicker = getEditingPicker();

      expect(frenchSubjectInput).toHaveValue(FRENCH_SUBJECT);
      expect(editingPicker).toHaveTextContent(/^Sign-in link.*Unsaved$/);
    });

    it('saves only the language that changed', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(updateEmailTemplateActionMock).toHaveBeenCalledTimes(1);
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        FR,
        { subject: FRENCH_SUBJECT, body: null },
      );
      expect(updateEmailConfigActionMock).not.toHaveBeenCalled();
    });

    it('restores the saved copy on Discard', async () => {
      const discardButton = screen.getByRole('button', { name: 'Discard' });
      await user.click(discardButton);

      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });

      expect(frenchSubjectInput).toHaveValue('');
      expect(saveButton).not.toBeInTheDocument();
    });

    it('keeps the edit unsaved when the save fails', async () => {
      updateEmailTemplateActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const failure = await screen.findByText(/Couldn't save every change/);
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);

      expect(failure).toBeVisible();
      expect(frenchSubjectInput).toHaveValue(FRENCH_SUBJECT);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('previews the edited subject and sends it as a test', async () => {
      const previewRegion = screen.getByRole('region', { name: 'Preview' });

      expect(previewRegion).toHaveTextContent(FRENCH_SUBJECT);

      const sendTestButton = screen.getByRole('button', {
        name: SEND_TEST_TO_ME,
      });
      await user.click(sendTestButton);

      const confirmation = await screen.findByText(
        `Test sent to ${MOCK_ADMIN_EMAIL}.`,
      );

      expect(confirmation).toBeVisible();
      expect(sendTestEmailActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        copy: {
          subject: FRENCH_SUBJECT,
          body: EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[FR][
            EMAIL_TEMPLATE_TYPE.MAGIC_LINK
          ].body,
        },
        sender: BLANK_SENDER_INPUT,
      });
    });

    it('says when the test limit is reached', async () => {
      sendTestEmailActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.RATE_LIMITED,
      });

      const sendTestButton = screen.getByRole('button', {
        name: SEND_TEST_TO_ME,
      });
      await user.click(sendTestButton);

      const rateLimitMessage = await screen.findByText(
        /You've sent several tests recently/,
      );

      expect(rateLimitMessage).toBeVisible();
    });
  });

  describe('the sender logo', () => {
    beforeEach(async () => {
      uploadEmailLogoActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        url: MOCK_EMAIL_LOGO_URL,
      });
      setup();
      await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    });

    it('is not uploaded when picked', async () => {
      await waitFor(() => {
        const editingPicker = getEditingPicker();

        expect(editingPicker).toHaveTextContent(/^Sender & footer.*Unsaved$/);
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
      await user.type(senderNameInput, TYPED_SENDER_NAME);
      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
      await user.type(frenchSubjectInput, FRENCH_SUBJECT);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent(
        '2 unsaved changesAll languages 1 · French 1',
      );
    });

    it('shows no language breakdown with one live language', async () => {
      setup({ liveLocales: [EN] });
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      await user.type(senderNameInput, TYPED_SENDER_NAME);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent('1 unsaved change');
      expect(saveBar).not.toHaveTextContent(/All languages|English/);
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
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        await user.click(saveButton);
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
        await user.type(senderNameInput, INVALID_SENDER_NAME);
      });

      it('opens Sender & footer and focuses the sender name from a template', async () => {
        await openSignInTemplate(user);
        const subjectInput = screen.getByLabelText(SUBJECT_ENGLISH);
        await user.type(subjectInput, '!');
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const senderNameInput = screen.getByLabelText(SENDER_NAME);
        const editingPicker = getEditingPicker();

        expect(senderNameInput).toHaveFocus();
        expect(editingPicker).toHaveTextContent(/^Sender & footer/);
      });

      it('returns to the Edit tab and focuses the sender name from the Preview', async () => {
        const previewTab = screen.getByRole('tab', { name: 'Preview' });
        await user.click(previewTab);
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const editTab = screen.getByRole('tab', { name: 'Edit' });
        const senderNameInput = screen.getByLabelText(SENDER_NAME);

        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
        expect(senderNameInput).toHaveFocus();
      });
    });
  });

  it('shows the sender-name error the save returns', async () => {
    updateEmailConfigActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
      },
    });
    setup();

    const senderNameInput = screen.getByLabelText(SENDER_NAME);
    await user.type(senderNameInput, INVALID_SENDER_NAME);
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
    await user.click(saveButton);

    const error = await screen.findByText(/not an email address/);

    expect(error).toBeVisible();
  });

  it('clears a saved contact recipient by saving it empty', async () => {
    setup({
      initialDraft: {
        ...INITIAL_DRAFT,
        sender: {
          ...INITIAL_DRAFT.sender,
          contactRecipient: SAVED_CONTACT_RECIPIENT,
        },
      },
    });

    const contactRecipientInput = screen.getByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );
    await user.clear(contactRecipientInput);
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
    await user.click(saveButton);

    await waitFor(() =>
      expect(updateEmailConfigActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        ...BLANK_SENDER_INPUT,
        contactRecipient: null,
      }),
    );
  });

  it('shows the contact-recipient error the save returns', async () => {
    updateEmailConfigActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        contactRecipient: {
          reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
        },
      },
    });
    setup();

    const contactRecipientInput = screen.getByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );
    await user.type(contactRecipientInput, 'nope');
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
    await user.click(saveButton);

    const error = await screen.findByText(/Enter a valid email address/);

    expect(error).toBeVisible();
  });

  it('restores an unsaved translation after leaving the page, but not a staged logo', async () => {
    const { unmount } = setup();
    await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');
    const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
    await user.type(frenchSubjectInput, FRENCH_SUBJECT);
    unmount();

    setup();
    const restoreButton = screen.getByRole('button', {
      name: RESTORE_CHANGES_NAME,
    });
    await user.click(restoreButton);
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');

    const restoredSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
    const list = await openPicker(user);
    const senderOption = within(list).getByRole('option', {
      name: /^Sender & footer.*Default$/,
    });

    expect(restoredSubjectInput).toHaveValue(FRENCH_SUBJECT);
    expect(senderOption).toBeVisible();
  });

  it('shows a restored message in the template already open', async () => {
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'email' }),
      {
        values: withCopy(
          INITIAL_DRAFT,
          { templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK, locale: EN },
          {
            subject: SIGN_IN_TO_ACME,
            body: [
              {
                _type: 'block',
                _key: 'b1',
                style: 'normal',
                children: [
                  {
                    _type: 'span',
                    _key: 's1',
                    text: WELCOME_BACK,
                    marks: [],
                  },
                ],
                markDefs: [],
              },
            ],
          },
        ),
        baseline: INITIAL_DRAFT,
        takenAt: new Date().toISOString(),
      },
    );
    setup();
    await openSignInTemplate(user);

    const restoreButton = screen.getByRole('button', {
      name: RESTORE_CHANGES_NAME,
    });
    await user.click(restoreButton);

    const messageEditor = await screen.findByRole('textbox', {
      name: 'Message (English)',
    });

    expect(messageEditor).toHaveTextContent(WELCOME_BACK);
  });

  it('is read-only for an archived tenant', () => {
    setup({ archivedAt: MOCK_ARCHIVED_AT });

    expectArchivedOffersNoSave();
    const senderNameInput = screen.getByLabelText(SENDER_NAME);

    expect(senderNameInput).toBeDisabled();
  });
});
