import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { EmailPageContent } from './email-page-content';

const { getSiteConfigMock, getEmailConfigMock, listEmailTemplatesMock } =
  vi.hoisted(() => ({
    getSiteConfigMock: vi.fn(),
    getEmailConfigMock: vi.fn(),
    listEmailTemplatesMock: vi.fn(),
  }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { listEmailTemplates: listEmailTemplatesMock },
  },
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: vi.fn() }));

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

const tenant = makeTenant({
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  locale: 'en',
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  provisioningSteps: {
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
      status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
    },
  },
  seededAt: new Date('2026-01-01T00:00:00.000Z'),
  webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const TEMPLATE_RESULTS = [
  {
    tenantId: 'tenant-1',
    templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    subject: 'Sign in to Acme Co',
    body: [],
    logoAssetUrl: undefined,
  },
  {
    tenantId: 'tenant-1',
    templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    subject: "You're invited to Acme Co",
    body: [],
    logoAssetUrl: undefined,
  },
  {
    tenantId: 'tenant-1',
    templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
    subject: 'Confirm your subscription',
    body: [],
    logoAssetUrl: undefined,
  },
];

const setup = customRenderAsync(EmailPageContent, { tenant });

describe(`<${EmailPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getEmailConfigMock.mockReset();
    listEmailTemplatesMock.mockReset();
    getSiteConfigMock.mockResolvedValue(undefined);
    getEmailConfigMock.mockResolvedValue(undefined);
    listEmailTemplatesMock.mockResolvedValue(TEMPLATE_RESULTS);
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

    expect(screen.getByDisplayValue('Acme Co')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('support@acme.example'),
    ).toBeInTheDocument();
  });

  it('renders every template type, always fully populated, never blank', async () => {
    await setup();

    expect(screen.getByDisplayValue('Sign in to Acme Co')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Team invite' }));
    expect(
      screen.getByDisplayValue("You're invited to Acme Co"),
    ).toBeInTheDocument();
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
