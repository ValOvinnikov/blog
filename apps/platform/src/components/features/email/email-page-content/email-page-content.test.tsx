import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TEmailConfig } from '@blog/db/schema/email-config';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  MOCK_CONTACT_RECIPIENT,
  SEND_CONTACT_MESSAGES_TO,
} from '@platform/testing/email/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { EmailPageContent } from './email-page-content';

faker.seed(5993);

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

vi.mock('@platform/server/email/send-test-email-action');

const { senderNameLabel, replyToLabel } = en.emailSettingsForm;

const MOCK_TENANT = mockReadyTenant();
const MOCK_GROWTH_TENANT = { ...MOCK_TENANT, plan: TENANT_PLAN.GROWTH };
const MOCK_INVITE_SUBJECT = faker.lorem.sentence();
const MOCK_CONFIG_DATE = faker.date.past();

const mockEmailConfig = (
  overrides: Partial<TEmailConfig> = {},
): TEmailConfig => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  logoAssetUrl: null,
  senderName: faker.company.name(),
  replyToAddress: faker.internet.email(),
  footerPostalAddress: faker.location.streetAddress(),
  contactRecipient: null,
  createdAt: MOCK_CONFIG_DATE,
  updatedAt: MOCK_CONFIG_DATE,
  ...overrides,
});

const setup = customRenderAsync(EmailPageContent, { tenant: MOCK_TENANT });

describe(`<${EmailPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockResolvedValue(undefined);
    getEmailConfigMock.mockResolvedValue(undefined);
    listEmailTemplateLogoUrlsMock.mockResolvedValue({
      [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: undefined,
      [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: undefined,
      [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: undefined,
    });
    listAuthoredEmailTemplatesMock.mockResolvedValue([
      {
        templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
        locale: LOCALE_ISO_CODES.EN,
        subject: MOCK_INVITE_SUBJECT,
        body: null,
      },
    ]);
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the Email page heading', () => {
      const heading = screen.getByRole('heading', {
        name: en.emailForm.pageHeading,
      });

      expect(heading).toBeVisible();
    });

    it('renders blank sender fields when the tenant has saved none yet', () => {
      const senderNameInput = screen.getByLabelText(senderNameLabel);
      const replyToInput = screen.getByLabelText(replyToLabel);

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
      const editingCombobox = screen.getByRole('combobox', {
        name: en.emailForm.editingLabel,
      });
      await user.click(editingCombobox);
      const teamInviteOption = await screen.findByRole('option', {
        name: new RegExp(
          `^${en.emailTemplateEditor.templateTypeLabel.TENANT_INVITE}`,
        ),
      });
      await user.click(teamInviteOption);

      const subjectInput = screen.getByDisplayValue(MOCK_INVITE_SUBJECT);

      expect(subjectInput).toBeVisible();
    });
  });

  it("renders the tenant's saved sender settings", async () => {
    const emailConfig = mockEmailConfig();
    getEmailConfigMock.mockResolvedValueOnce(emailConfig);

    await setup();

    const senderNameInput = screen.getByLabelText(senderNameLabel);
    const replyToInput = screen.getByLabelText(replyToLabel);

    expect(senderNameInput).toHaveValue(emailConfig.senderName);
    expect(replyToInput).toHaveValue(emailConfig.replyToAddress);
  });

  it('shows the stored contact recipient on a plan with the contact form', async () => {
    getEmailConfigMock.mockResolvedValueOnce(
      mockEmailConfig({ contactRecipient: MOCK_CONTACT_RECIPIENT }),
    );

    await setup({ tenant: MOCK_GROWTH_TENANT });

    const contactRecipientInput = screen.getByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );

    expect(contactRecipientInput).toHaveValue(MOCK_CONTACT_RECIPIENT);
  });

  it('hides the contact recipient field from an editor', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(async (id) => ({
      tenant: mockReadyTenant({ id, plan: TENANT_PLAN.GROWTH }),
      membership: mockMembership({
        tenantId: id,
        role: MEMBERSHIP_ROLE.EDITOR,
      }),
    }));

    await setup({ tenant: MOCK_GROWTH_TENANT });

    const contactRecipientInput = screen.queryByLabelText(
      SEND_CONTACT_MESSAGES_TO,
    );

    expect(contactRecipientInput).not.toBeInTheDocument();
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await setup({
      tenant: { ...MOCK_TENANT, deprovisionedAt: MOCK_ARCHIVED_AT },
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });
});
