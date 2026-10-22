import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { selectFile } from '@platform/testing/select-file';
import { TENANT_EMAIL_BRAND as BRAND } from '@platform/testing/tenant-email-brand';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
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
  tenantId: TENANT_ID,
  initialDraft: INITIAL_DRAFT,
  defaultLocale: EN,
  liveLocales: LIVE_LOCALES,
  brand: BRAND,
  brandName: 'Acme Co',
});

const picker = () => screen.getByRole('combobox', { name: 'Editing' });

const openPicker = async (user: UserEvent) => {
  await user.click(picker());
  return screen.findByRole('listbox');
};

const openSignInTemplate = async (user: UserEvent) => {
  const list = await openPicker(user);
  await user.click(within(list).getByRole('option', { name: /^Sign-in link/ }));
};

const chooseLanguage = (user: UserEvent, name: string) =>
  user.click(screen.getByRole('button', { name }));

const SENDER_NAME = 'Sender name';
const SUBJECT_ENGLISH = 'Subject (English)';
const ARIA_SELECTED = 'aria-selected';
const SUBJECT_FRENCH = 'Subject (French)';
const SAVE_CHANGES = 'Save changes';
const SEND_TEST_TO_ME = 'Send test to me';
const GO_TO_THE_FIRST_ONE = 'Go to the first one';
const ONE_FIELD_NEEDS_ATTENTION = '1 field needs attention';
const SEND_CONTACT_MESSAGES_TO = 'Send contact messages to';
const LEADS_ACME_EXAMPLE = 'leads@acme.example';
const WELCOME_BACK = 'Welcome back';

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
      to: 'admin@example.com',
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('opens on Sender & footer, with each template marked for the default language', async () => {
    setup();

    expect(screen.getByLabelText(SENDER_NAME)).toBeVisible();
    expect(picker()).toHaveTextContent(/^Sender & footer/);

    const list = await openPicker(user);

    expect(
      within(list).getByRole('option', { name: /^Sign-in link.*Customised$/ }),
    ).toBeVisible();
    expect(
      within(list).getByRole('option', { name: /^Team invite.*Default$/ }),
    ).toBeVisible();
  });

  it('opens the email chosen from the picker in the editor', async () => {
    setup();

    await openSignInTemplate(user);

    expect(screen.getByLabelText(SUBJECT_ENGLISH)).toHaveValue(SIGN_IN_TO_ACME);
    expect(screen.queryByLabelText(SENDER_NAME)).not.toBeInTheDocument();
    expect(picker()).toHaveTextContent('Sign-in linkTemplate · Customised');
  });

  it('switches between the Edit and Preview tabs', async () => {
    setup();

    const editTab = within(
      screen.getByRole('tablist', { name: 'Edit or preview' }),
    ).getByRole('tab', { name: 'Edit' });
    const previewTab = screen.getByRole('tab', { name: 'Preview' });
    expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
    expect(screen.getByRole('tabpanel', { name: 'Edit' })).toContainElement(
      screen.getByLabelText(SENDER_NAME),
    );

    await user.click(previewTab);

    expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).toContainElement(
      screen.getByRole('region', { name: 'Preview' }),
    );
  });

  it("shows the language picker on Sender & footer, describing each language's customised templates", async () => {
    setup();

    const picker = screen.getByRole('group', { name: 'Language' });
    expect(
      within(picker).getByRole('button', { name: 'English' }),
    ).toHaveAccessibleDescription('Default language · 1 customised');
    expect(
      within(picker).getByRole('button', { name: 'French' }),
    ).toHaveAccessibleDescription('All default');

    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');
    await user.type(screen.getByLabelText(SUBJECT_FRENCH), 'Connexion');

    expect(
      within(picker).getByRole('button', { name: 'French' }),
    ).toHaveAccessibleDescription('1 customised');
  });

  describe('editing a template in two languages', () => {
    beforeEach(async () => {
      setup();
      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      await user.type(screen.getByLabelText(SUBJECT_FRENCH), 'Connexion');
    });

    it('falls back to the default-language subject in another language', async () => {
      await user.clear(screen.getByLabelText(SUBJECT_FRENCH));

      expect(screen.getByLabelText(SUBJECT_FRENCH)).toHaveAttribute(
        'placeholder',
        SIGN_IN_TO_ACME,
      );
    });

    it('keeps the edit across a language switch and marks the template unsaved', async () => {
      await chooseLanguage(user, 'English');
      await chooseLanguage(user, 'French');

      expect(screen.getByLabelText(SUBJECT_FRENCH)).toHaveValue('Connexion');
      expect(picker()).toHaveTextContent(/^Sign-in link.*Unsaved$/);
    });

    it('saves only the language that changed', async () => {
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(updateEmailTemplateActionMock).toHaveBeenCalledTimes(1);
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        FR,
        { subject: 'Connexion', body: null },
      );
      expect(updateEmailConfigActionMock).not.toHaveBeenCalled();
    });

    it('restores the saved copy on Discard', async () => {
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(screen.getByLabelText(SUBJECT_FRENCH)).toHaveValue('');
      expect(
        screen.queryByRole('button', { name: SAVE_CHANGES }),
      ).not.toBeInTheDocument();
    });

    it('keeps the edit unsaved when the save fails', async () => {
      updateEmailTemplateActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(
        await screen.findByText(/Couldn't save every change/),
      ).toBeVisible();
      expect(screen.getByLabelText(SUBJECT_FRENCH)).toHaveValue('Connexion');
      expect(refresh).not.toHaveBeenCalled();
    });
    it('previews the edited subject and sends it as a test', async () => {
      expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent(
        'Connexion',
      );

      await user.click(screen.getByRole('button', { name: SEND_TEST_TO_ME }));

      expect(
        await screen.findByText('Test sent to admin@example.com.'),
      ).toBeVisible();
      expect(sendTestEmailActionMock).toHaveBeenCalledWith(TENANT_ID, {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        copy: {
          subject: 'Connexion',
          body: expect.any(Array),
        },
        sender: {
          senderName: null,
          replyToAddress: null,
          footerPostalAddress: null,
        },
      });
    });

    it('says when the test limit is reached', async () => {
      sendTestEmailActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.RATE_LIMITED,
      });

      await user.click(screen.getByRole('button', { name: SEND_TEST_TO_ME }));

      expect(
        await screen.findByText(/You've sent several tests recently/),
      ).toBeVisible();
    });
  });

  describe('the sender logo', () => {
    beforeEach(async () => {
      uploadEmailLogoActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        url: 'https://example.blob.vercel-storage.com/email-logo.png',
      });
      setup();
      await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    });

    it('is not uploaded when picked', async () => {
      await waitFor(() =>
        expect(picker()).toHaveTextContent(/^Sender & footer.*Unsaved$/),
      );
      expect(uploadEmailLogoActionMock).not.toHaveBeenCalled();
    });

    it('is uploaded on Save', async () => {
      await user.click(
        await screen.findByRole('button', { name: SAVE_CHANGES }),
      );

      await waitFor(() =>
        expect(uploadEmailLogoActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          { type: 'tenant' },
          expect.any(FormData),
        ),
      );
    });
  });

  describe('the save bar', () => {
    const saveBar = () =>
      screen.getByRole('region', { name: 'Unsaved changes' });

    it('breaks the changes down so the parts add up to the total', async () => {
      setup();
      await user.type(screen.getByLabelText(SENDER_NAME), 'Acme');
      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      await user.type(screen.getByLabelText(SUBJECT_FRENCH), 'Connexion');

      expect(saveBar()).toHaveTextContent(
        '2 unsaved changesAll languages 1 · French 1',
      );
    });

    it('shows no language breakdown with one live language', async () => {
      setup({ liveLocales: [EN] });
      await user.type(screen.getByLabelText(SENDER_NAME), 'Acme');

      expect(saveBar()).toHaveTextContent('1 unsaved change');
      expect(saveBar()).not.toHaveTextContent(/All languages|English/);
    });

    describe('when the sender name is rejected', () => {
      const goToFirstField = () =>
        user.click(
          within(saveBar()).getByRole('link', { name: GO_TO_THE_FIRST_ONE }),
        );

      const saveAndSettle = async () => {
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
        await within(saveBar()).findByRole('link', {
          name: GO_TO_THE_FIRST_ONE,
        });
        await within(saveBar()).findByRole('button', { name: SAVE_CHANGES });
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
        await user.type(screen.getByLabelText(SENDER_NAME), 'a@b');
      });

      it('opens Sender & footer and focuses the sender name from a template', async () => {
        await openSignInTemplate(user);
        await user.type(screen.getByLabelText(SUBJECT_ENGLISH), '!');
        await saveAndSettle();

        expect(saveBar()).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        expect(screen.getByLabelText(SENDER_NAME)).toHaveFocus();
        expect(picker()).toHaveTextContent(/^Sender & footer/);
      });

      it('returns to the Edit tab and focuses the sender name from the Preview', async () => {
        await user.click(screen.getByRole('tab', { name: 'Preview' }));
        await saveAndSettle();

        expect(saveBar()).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        expect(screen.getByRole('tab', { name: 'Edit' })).toHaveAttribute(
          ARIA_SELECTED,
          'true',
        );
        expect(screen.getByLabelText(SENDER_NAME)).toHaveFocus();
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

    await user.type(screen.getByLabelText(SENDER_NAME), 'a@b');
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    expect(await screen.findByText(/not an email address/)).toBeVisible();
  });

  it('saves the contact recipient the owner types', async () => {
    setup();

    await user.type(
      screen.getByLabelText(SEND_CONTACT_MESSAGES_TO),
      LEADS_ACME_EXAMPLE,
    );
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    await waitFor(() =>
      expect(updateEmailConfigActionMock).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ contactRecipient: LEADS_ACME_EXAMPLE }),
      ),
    );
  });

  it('clears a saved contact recipient by saving it empty', async () => {
    setup({
      initialDraft: {
        ...INITIAL_DRAFT,
        sender: { ...INITIAL_DRAFT.sender, contactRecipient: 'a@acme.example' },
      },
    });

    await user.clear(screen.getByLabelText(SEND_CONTACT_MESSAGES_TO));
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    await waitFor(() =>
      expect(updateEmailConfigActionMock).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ contactRecipient: null }),
      ),
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

    await user.type(screen.getByLabelText(SEND_CONTACT_MESSAGES_TO), 'nope');
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    expect(
      await screen.findByText(/Enter a valid email address/),
    ).toBeVisible();
  });

  it('restores an unsaved translation after leaving the page, but not a staged logo', async () => {
    const { unmount } = setup();
    await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');
    await user.type(screen.getByLabelText(SUBJECT_FRENCH), 'Connexion');
    unmount();

    setup();
    await user.click(
      screen.getByRole('button', { name: /^Restore \d+ changes?$/ }),
    );
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');

    expect(screen.getByLabelText(SUBJECT_FRENCH)).toHaveValue('Connexion');
    expect(
      within(await openPicker(user)).getByRole('option', {
        name: /^Sender & footer.*Default$/,
      }),
    ).toBeVisible();
  });

  it('shows a restored message in the template already open', async () => {
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: TENANT_ID, page: 'email' }),
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

    await user.click(
      screen.getByRole('button', { name: /^Restore \d+ changes?$/ }),
    );

    expect(
      await screen.findByRole('textbox', { name: 'Message (English)' }),
    ).toHaveTextContent(WELCOME_BACK);
  });

  it('is read-only for an archived tenant', () => {
    setup({ archivedAt: new Date('2026-08-26T00:00:00.000Z') });

    expectArchivedOffersNoSave();
    expect(screen.getByLabelText(SENDER_NAME)).toBeDisabled();
  });
});
