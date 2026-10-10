import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { EmailPageContent } from './email-page-content';

const {
  getSiteConfigMock,
  getEmailConfigMock,
  listEmailTemplateLogoUrlsMock,
  listAuthoredEmailTemplatesMock,
  selectLiveLocalesMock,
} = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  listEmailTemplateLogoUrlsMock: vi.fn(),
  listAuthoredEmailTemplatesMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: {
      listEmailTemplateLogoUrls: listEmailTemplateLogoUrlsMock,
      listAuthoredEmailTemplates: listAuthoredEmailTemplatesMock,
    },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/email-config/update-email-config-action', () => ({
  updateEmailConfigAction: vi.fn(),
}));

vi.mock(
  '@platform/server/email-templates/update-email-template-action',
  () => ({
    updateEmailTemplateAction: vi.fn(),
  }),
);

vi.mock('@platform/server/email/upload-email-logo-action', () => ({
  uploadEmailLogoAction: vi.fn(),
}));

vi.mock('@platform/server/email/clear-email-logo-action', () => ({
  clearEmailLogoAction: vi.fn(),
}));

vi.mock('@platform/server/email/send-test-email-action', () => ({
  sendTestEmailAction: vi.fn(),
}));

const tenant = makeReadyTenant();

const TEMPLATE_LOGO_URLS = {
  [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: undefined,
  [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: undefined,
  [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: undefined,
};

const setup = customRenderAsync(EmailPageContent, { tenant });

describe(`<${EmailPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getEmailConfigMock.mockReset();
    listEmailTemplateLogoUrlsMock.mockReset();
    getSiteConfigMock.mockResolvedValue(undefined);
    getEmailConfigMock.mockResolvedValue(undefined);
    listEmailTemplateLogoUrlsMock.mockResolvedValue(TEMPLATE_LOGO_URLS);
    listAuthoredEmailTemplatesMock.mockReset();
    listAuthoredEmailTemplatesMock.mockResolvedValue([
      {
        templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
        locale: LOCALE_ISO_CODES.EN,
        subject: "You're invited to Acme Co",
        body: null,
      },
    ]);
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  it('renders the Email page heading', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Email' })).toBeVisible();
  });

  it('renders blank settings fields when the tenant has no saved email_config row yet', async () => {
    await setup();

    expect(screen.getByLabelText('Sender name')).toHaveValue('');
    expect(screen.getByLabelText('Reply-to address')).toHaveValue('');
  });

  it("renders the tenant's saved email_config row when one exists", async () => {
    getEmailConfigMock.mockResolvedValue({
      id: 'config-1',
      tenantId: 'tenant-1',
      senderName: 'Acme Co',
      replyToAddress: 'support@acme.example',
      footerPostalAddress: '123 Main St',
      logoAssetUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup();

    expect(screen.getByDisplayValue('Acme Co')).toBeVisible();
    expect(screen.getByDisplayValue('support@acme.example')).toBeVisible();
  });

  it("shows each template's authored copy in the tenant's default language", async () => {
    await setup();

    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Editing' }));
    await user.click(
      await screen.findByRole('option', { name: /^Team invite/ }),
    );

    expect(screen.getByDisplayValue("You're invited to Acme Co")).toBeVisible();
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
  });
});
