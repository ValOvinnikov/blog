import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { selectFile } from '@platform/testing/select-file';
import { TENANT_EMAIL_BRAND as BRAND } from '@platform/testing/tenant-email-brand';
import { buildEmailDraft } from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

const {
  updateEmailTemplateActionMock,
  updateEmailConfigActionMock,
  uploadEmailLogoActionMock,
  clearEmailLogoActionMock,
} = vi.hoisted(() => ({
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

const { EN, FR } = LOCALE_ISO_CODES;
const LIVE_LOCALES = [EN, FR];

const setup = customRender(EmailSettings, {
  tenantId: 'tenant-1',
  initialDraft: buildEmailDraft({
    sender: { senderName: '', replyToAddress: '', footerPostalAddress: '' },
    senderLogoUrl: undefined,
    authored: [
      {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: EN,
        subject: 'Sign in to Acme',
        body: null,
      },
    ],
    templateLogoUrls: {
      MAGIC_LINK: undefined,
      TENANT_INVITE: undefined,
      NEWSLETTER_CONFIRMATION: undefined,
    },
    liveLocales: LIVE_LOCALES,
  }),
  defaultLocale: EN,
  liveLocales: LIVE_LOCALES,
  brand: BRAND,
  brandName: 'Acme Co',
});

const openSignInTemplate = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: /^Sign-in link/ }));

const chooseLanguage = (user: UserEvent, name: string) =>
  user.click(screen.getByRole('button', { name }));

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    updateEmailTemplateActionMock.mockReset();
    updateEmailTemplateActionMock.mockResolvedValue({ ok: true });
    updateEmailConfigActionMock.mockReset();
    updateEmailConfigActionMock.mockResolvedValue({ ok: true });
    uploadEmailLogoActionMock.mockReset();
    clearEmailLogoActionMock.mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('opens on Sender & footer, with each template marked for the default language', () => {
    setup();

    expect(screen.getByLabelText('Sender name')).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Sign-in link.*Customised$/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Team invite.*Default$/ }),
    ).toBeVisible();
  });

  describe('editing a template in two languages', () => {
    beforeEach(async () => {
      setup();
      await openSignInTemplate(user);
      await chooseLanguage(user, 'French');
      await user.type(screen.getByLabelText('Subject (French)'), 'Connexion');
    });

    it('falls back to the default-language subject in another language', async () => {
      await user.clear(screen.getByLabelText('Subject (French)'));

      expect(screen.getByLabelText('Subject (French)')).toHaveAttribute(
        'placeholder',
        'Sign in to Acme',
      );
    });

    it('keeps the edit across a language switch and marks the template unsaved', async () => {
      await chooseLanguage(user, 'English');
      await chooseLanguage(user, 'French');

      expect(screen.getByLabelText('Subject (French)')).toHaveValue(
        'Connexion',
      );
      expect(
        screen.getByRole('button', { name: /^Sign-in link.*Unsaved$/ }),
      ).toBeVisible();
    });

    it('saves only the language that changed', async () => {
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(updateEmailTemplateActionMock).toHaveBeenCalledTimes(1);
      expect(updateEmailTemplateActionMock).toHaveBeenCalledWith(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        FR,
        { subject: 'Connexion', body: null },
      );
      expect(updateEmailConfigActionMock).not.toHaveBeenCalled();
    });

    it('restores the saved copy on Discard', async () => {
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(screen.getByLabelText('Subject (French)')).toHaveValue('');
      expect(
        screen.queryByRole('button', { name: 'Save changes' }),
      ).not.toBeInTheDocument();
    });

    it('keeps the edit unsaved when the save fails', async () => {
      updateEmailTemplateActionMock.mockResolvedValue({ ok: false });

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText(/Couldn't save every change/),
      ).toBeVisible();
      expect(screen.getByLabelText('Subject (French)')).toHaveValue(
        'Connexion',
      );
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe('the sender logo', () => {
    beforeEach(async () => {
      uploadEmailLogoActionMock.mockResolvedValue({
        ok: true,
        url: 'https://example.blob.vercel-storage.com/email-logo.png',
      });
      setup();
      await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    });

    it('is not uploaded when picked', async () => {
      expect(
        await screen.findByRole('button', {
          name: /^Sender & footer.*Unsaved$/,
        }),
      ).toBeVisible();
      expect(uploadEmailLogoActionMock).not.toHaveBeenCalled();
    });

    it('is uploaded on Save', async () => {
      await user.click(
        await screen.findByRole('button', { name: 'Save changes' }),
      );

      await waitFor(() =>
        expect(uploadEmailLogoActionMock).toHaveBeenCalledWith(
          'tenant-1',
          { type: 'tenant' },
          expect.any(FormData),
        ),
      );
    });
  });

  it('shows the sender-name error the save returns', async () => {
    updateEmailConfigActionMock.mockResolvedValue({
      ok: false,
      fieldErrors: { senderName: 'Enter a name, not an address.' },
    });
    setup();

    await user.type(screen.getByLabelText('Sender name'), 'a@b');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Enter a name, not an address.'),
    ).toBeVisible();
  });

  it('restores an unsaved translation after leaving the page, but not a staged logo', async () => {
    const { unmount } = setup();
    await selectFile(new File(['x'], 'logo.png', { type: 'image/png' }));
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');
    await user.type(screen.getByLabelText('Subject (French)'), 'Connexion');
    unmount();

    setup();
    await user.click(
      screen.getByRole('button', { name: /^Restore \d+ changes?$/ }),
    );
    await openSignInTemplate(user);
    await chooseLanguage(user, 'French');

    expect(screen.getByLabelText('Subject (French)')).toHaveValue('Connexion');
    expect(
      screen.getByRole('button', { name: /^Sender & footer.*Default$/ }),
    ).toBeVisible();
  });

  it('is read-only for an archived tenant', () => {
    setup({ archivedAt: new Date('2026-08-26T00:00:00.000Z') });

    expectArchivedOffersNoSave();
    expect(screen.getByLabelText('Sender name')).toBeDisabled();
  });
});
