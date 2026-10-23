import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  MOCK_CONTACT_RECIPIENT,
  SEND_CONTACT_MESSAGES_TO,
} from '@platform/testing/email/fixtures';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  makeReadyTenant,
  MOCK_ARCHIVED_AT,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
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

vi.mock('@platform/server/auth/require-tenant-membership');

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

const YOURE_INVITED_ACME_CO = "You're invited to Acme Co";
const SUPPORT_ACME_EXAMPLE = 'support@acme.example';

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
        subject: YOURE_INVITED_ACME_CO,
        body: null,
      },
    ]);
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the Email page heading', () => {
      const heading = screen.getByRole('heading', { name: 'Email' });

      expect(heading).toBeVisible();
    });

    it('renders blank settings fields when the tenant has no saved email_config row yet', () => {
      const senderNameInput = screen.getByLabelText('Sender name');
      const replyToInput = screen.getByLabelText('Reply-to address');

      expect(senderNameInput).toHaveValue('');
      expect(replyToInput).toHaveValue('');
    });

    it('hides the contact recipient field on a plan without the contact form', () => {
      const contactRecipientInput = screen.queryByLabelText(
        SEND_CONTACT_MESSAGES_TO,
      );

      expect(contactRecipientInput).not.toBeInTheDocument();
    });

    it("shows each template's authored copy in the tenant's default language", async () => {
      const user = userEvent.setup();
      const editingCombobox = screen.getByRole('combobox', { name: 'Editing' });
      await user.click(editingCombobox);
      const teamInviteOption = await screen.findByRole('option', {
        name: /^Team invite/,
      });
      await user.click(teamInviteOption);

      const subjectInput = screen.getByDisplayValue(YOURE_INVITED_ACME_CO);

      expect(subjectInput).toBeVisible();
    });
  });

  it("renders the tenant's saved email_config row when one exists", async () => {
    getEmailConfigMock.mockResolvedValue({
      id: 'config-1',
      tenantId: TENANT_ID,
      senderName: 'Acme Co',
      replyToAddress: SUPPORT_ACME_EXAMPLE,
      footerPostalAddress: '123 Main St',
      logoAssetUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup();

    const senderNameInput = screen.getByDisplayValue('Acme Co');
    const replyToInput = screen.getByDisplayValue(SUPPORT_ACME_EXAMPLE);

    expect(senderNameInput).toBeVisible();
    expect(replyToInput).toBeVisible();
  });

  it('shows the stored contact recipient on a plan with the contact form', async () => {
    getEmailConfigMock.mockResolvedValue({
      senderName: 'Acme Co',
      contactRecipient: MOCK_CONTACT_RECIPIENT,
      updatedAt: new Date(),
    });

    await setup({ tenant: { ...tenant, plan: TENANT_PLAN.GROWTH } });

    const contactRecipientInput = screen.getByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );

    expect(contactRecipientInput).toHaveValue(MOCK_CONTACT_RECIPIENT);
  });

  it('hides the contact recipient field from an editor', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(async (id) => ({
      tenant: makeReadyTenant({ id, plan: TENANT_PLAN.GROWTH }),
      membership: makeMembership({
        tenantId: id,
        role: MEMBERSHIP_ROLE.EDITOR,
      }),
    }));

    await setup({ tenant: { ...tenant, plan: TENANT_PLAN.GROWTH } });

    const contactRecipientInput = screen.queryByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );

    expect(contactRecipientInput).not.toBeInTheDocument();
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });
});
