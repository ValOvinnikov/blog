import { resolveTenantEmailBrand } from '@blog/config';
import {
  AUTH_APP,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  PRESET_ID,
} from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
  TENANT_PLAN,
} from '@blog/db/constants';

import { buildMagicLinkProvider } from './magic-link-provider';

const MAGIC_LINK_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK];
const TENANT_INVITE_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.TENANT_INVITE];

const SITE_ORIGIN = 'https://example.com';
const PLATFORM_ORIGIN = 'https://platform.example.com';
const TOKEN = 'abc';
const READER_EMAIL = 'jane@example.com';
const INVITED_EMAIL = 'invited@example.com';
const ADMIN_EMAIL = 'admin@example.com';
const FROM_ADDRESS = 'Sign in <onboarding@resend.dev>';
const SITE_CALLBACK_URL = `${SITE_ORIGIN}/api/auth/callback/email?token=${TOKEN}`;
const PLATFORM_CALLBACK_URL = `${PLATFORM_ORIGIN}/api/auth/callback/email?token=${TOKEN}`;
const PLATFORM_LAYOUT_MARK = '>Platform</td>';
const CUSTOM_SENDER_FROM = 'Acme Support <onboarding@resend.dev>';
const CUSTOM_SENDER_NAME = 'Acme Support';
const CUSTOM_REPLY_TO = 'support@acme.example.com';
const CUSTOM_POSTAL_ADDRESS = '123 Main St, Springfield';
const CUSTOM_SUBJECT = 'Welcome back to Acme';
const CUSTOM_BODY_TEXT = 'Use the button below to get back in.';
const ADVERSARIAL_LINK_KEY = 'adversarial-link';
const SITE_LINK_HREF = `href="${SITE_CALLBACK_URL}"`;

function sendVerificationRequestFor(
  provider: ReturnType<typeof buildMagicLinkProvider>,
  {
    identifier = READER_EMAIL,
    url = SITE_CALLBACK_URL,
  }: { identifier?: string; url?: string } = {},
) {
  return provider.sendVerificationRequest({
    identifier,
    url,
    expires: new Date('2026-01-01T00:00:00.000Z'),
    provider,
    token: TOKEN,
    theme: {},
    request: new Request(new URL(url).origin),
  });
}

const {
  findPendingInviteByEmailMock,
  listTenantsByIdsMock,
  getTenantByDomainMock,
  getSiteConfigMock,
  getEmailConfigMock,
  getEmailTemplateMock,
  sendEmailMock,
  isMagicLinkSendAllowedMock,
} = vi.hoisted(() => ({
  findPendingInviteByEmailMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  sendEmailMock: vi.fn(),
  isMagicLinkSendAllowedMock: vi.fn(),
}));

vi.mock(
  '@blog/auth/providers/magic-link/is-magic-link-send-allowed/is-magic-link-send-allowed',
  () => ({ isMagicLinkSendAllowed: isMagicLinkSendAllowedMock }),
);

vi.mock('@blog/db', async () => ({
  queries: {
    membershipInvites: {
      findPendingInviteByEmail: findPendingInviteByEmailMock,
    },
    tenants: {
      ...(await vi.importActual(
        '@blog/db/queries/tenants/get-tenant-live-locales',
      )),
      listTenantsByIds: listTenantsByIdsMock,
    },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: sendEmailMock,
}));

describe(buildMagicLinkProvider, () => {
  let provider: ReturnType<typeof buildMagicLinkProvider>;

  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset().mockResolvedValue([]);
    listTenantsByIdsMock.mockReset();
    getTenantByDomainMock.mockReset().mockResolvedValue(undefined);
    getSiteConfigMock.mockReset();
    getEmailConfigMock.mockReset().mockResolvedValue(undefined);
    getEmailTemplateMock.mockReset().mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    isMagicLinkSendAllowedMock.mockResolvedValue(true);
    provider = buildMagicLinkProvider(AUTH_APP.SITE);
  });

  it('sends nothing once the send limit refuses the request', async () => {
    isMagicLinkSendAllowedMock.mockResolvedValue(false);

    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('identifies itself as the email provider', () => {
    expect(provider.id).toBe('email');
    expect(provider.type).toBe('email');
  });

  it('resolves the from address via resolveMagicLinkFromAddress', () => {
    expect(provider.from).toBe(FROM_ADDRESS);
  });

  it("delivers the sign-in link through @blog/email's sendEmail", async () => {
    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: READER_EMAIL,
      from: FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
      html: expect.stringContaining(SITE_LINK_HREF),
    });
  });

  it('sends invite-flavored copy when the identifier has a pending invite', async () => {
    const provider = buildMagicLinkProvider(AUTH_APP.PLATFORM);
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog', locale: LOCALE_ISO_CODES.EN },
    ]);

    await sendVerificationRequestFor(provider, { identifier: INVITED_EMAIL });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(INVITED_EMAIL);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: INVITED_EMAIL,
        from: FROM_ADDRESS,
        subject: TENANT_INVITE_DEFAULTS.subject,
        html: expect.stringContaining('Accept invite'),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<strong>Acme Blog</strong>'),
      }),
    );
  });

  it("sends a site's own sign-in email to an address with a pending invite", async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog', locale: LOCALE_ISO_CODES.EN },
    ]);

    await sendVerificationRequestFor(provider, { identifier: INVITED_EMAIL });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: MAGIC_LINK_DEFAULTS.subject,
        html: expect.not.stringContaining('Acme Blog'),
      }),
    );
  });

  it('falls back to the generic copy and still delivers when the invite lookup throws', async () => {
    const provider = buildMagicLinkProvider(AUTH_APP.PLATFORM);
    findPendingInviteByEmailMock.mockRejectedValue(new Error('db error'));

    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: READER_EMAIL,
      from: FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
      html: expect.stringContaining(SITE_LINK_HREF),
    });
  });

  it("sends the admin's sign-in email in the platform layout", async () => {
    const provider = buildMagicLinkProvider(AUTH_APP.PLATFORM);

    await sendVerificationRequestFor(provider, {
      identifier: ADMIN_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: MAGIC_LINK_DEFAULTS.subject,
        html: expect.stringContaining(PLATFORM_LAYOUT_MARK),
      }),
    );
  });

  it("sends the admin's invite email in the platform layout", async () => {
    const provider = buildMagicLinkProvider(AUTH_APP.PLATFORM);
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog', locale: LOCALE_ISO_CODES.EN },
    ]);

    await sendVerificationRequestFor(provider, {
      identifier: INVITED_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: TENANT_INVITE_DEFAULTS.subject,
        html: expect.stringContaining(PLATFORM_LAYOUT_MARK),
      }),
    );
  });

  it("never sends a site's sign-in email in the platform layout", async () => {
    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.not.stringContaining('Platform'),
      }),
    );
  });

  it('still delivers, in the unnamed neutral shell, when the host resolves to no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: READER_EMAIL,
      from: FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
      html: expect.not.stringContaining('&copy;'),
    });
  });

  it('still delivers, in the unnamed neutral shell, when the tenant domain lookup throws', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error('db error'));

    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: READER_EMAIL,
      from: FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
      html: expect.not.stringContaining('&copy;'),
    });
  });

  it("writes an invite sent from a tenant-less host in the invited tenant's default language", async () => {
    const provider = buildMagicLinkProvider(AUTH_APP.PLATFORM);
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog', locale: LOCALE_ISO_CODES.ES },
    ]);

    await sendVerificationRequestFor(provider, {
      identifier: 'owner@example.com',
      url: PLATFORM_CALLBACK_URL,
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.ES][
            EMAIL_TEMPLATE_TYPE.TENANT_INVITE
          ].subject,
      }),
    );
  });

  it('writes a sign-in from a tenant-less host in English whatever the return-to path', async () => {
    await sendVerificationRequestFor(provider, {
      identifier: ADMIN_EMAIL,
      url: `${PLATFORM_ORIGIN}/api/auth/callback/email?${new URLSearchParams({
        callbackUrl: `${PLATFORM_ORIGIN}/fr`,
        token: TOKEN,
      })}`,
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.EN][
            EMAIL_TEMPLATE_TYPE.MAGIC_LINK
          ].subject,
      }),
    );
  });

  describe('when the host resolves to a tenant', () => {
    beforeEach(() => {
      getTenantByDomainMock.mockResolvedValue({
        id: 'tenant-1',
        name: 'Acme Blog',
        locale: LOCALE_ISO_CODES.EN,
        additionalLocales: [LOCALE_ISO_CODES.FR],
        plan: TENANT_PLAN.GROWTH,
      });
      getSiteConfigMock.mockResolvedValue({
        preset: PRESET_ID.CONSOLE,
        accentHue: 140,
        logoHue: undefined,
      });
    });

    it("brands the sign-in email with the resolved tenant's hue", async () => {
      await sendVerificationRequestFor(provider);

      const expectedBrand = resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 140,
      });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(expectedBrand.logo1),
        }),
      );
    });

    it("applies the tenant's sender name and reply-to address", async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: undefined,
        senderName: CUSTOM_SENDER_NAME,
        replyToAddress: CUSTOM_REPLY_TO,
        footerPostalAddress: undefined,
      });

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: CUSTOM_SENDER_FROM,
          replyTo: CUSTOM_REPLY_TO,
        }),
      );
    });

    it('drops a malformed stored reply-to address rather than blocking the send', async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: undefined,
        senderName: undefined,
        replyToAddress: 'not-an-email',
        footerPostalAddress: undefined,
      });

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ replyTo: undefined }),
      );
    });

    it('renders the resolved logo and footer postal address in the sent email', async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
        senderName: undefined,
        replyToAddress: undefined,
        footerPostalAddress: CUSTOM_POSTAL_ADDRESS,
      });
      getEmailTemplateMock.mockResolvedValue({
        logoAssetUrl: 'https://cdn.example.com/template-logo.png',
      });

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            'src="https://cdn.example.com/template-logo.png"',
          ),
        }),
      );
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(CUSTOM_POSTAL_ADDRESS),
        }),
      );
    });

    it('still delivers with product defaults when the email-config lookup fails', async () => {
      getEmailConfigMock.mockRejectedValue(new Error('db error'));

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: FROM_ADDRESS,
          replyTo: undefined,
        }),
      );
    });

    it('still delivers with product defaults when the email-template lookup fails', async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: undefined,
        senderName: CUSTOM_SENDER_NAME,
        replyToAddress: undefined,
        footerPostalAddress: undefined,
      });
      getEmailTemplateMock.mockRejectedValue(new Error('db error'));

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: CUSTOM_SENDER_FROM,
          subject: MAGIC_LINK_DEFAULTS.subject,
        }),
      );
    });

    it('sends the authored subject and body once a tenant has edited its magic-link copy', async () => {
      getEmailTemplateMock.mockResolvedValue({
        subject: CUSTOM_SUBJECT,
        body: [
          {
            _type: 'block',
            _key: 'authored-1',
            style: 'normal',
            children: [
              {
                _type: 'span',
                _key: 'authored-1-span',
                text: CUSTOM_BODY_TEXT,
                marks: [],
              },
            ],
          },
        ],
        logoAssetUrl: undefined,
      });

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: CUSTOM_SUBJECT,
          html: expect.stringContaining(CUSTOM_BODY_TEXT),
        }),
      );
    });

    it('keeps the sign-in action outside an authored body that mimics its own url and label', async () => {
      getEmailTemplateMock.mockResolvedValue({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: [
          {
            _type: 'block',
            _key: 'adversarial-1',
            style: 'normal',
            markDefs: [
              {
                _type: 'link',
                _key: ADVERSARIAL_LINK_KEY,
                href: 'https://attacker.example.com/phish',
              },
            ],
            children: [
              {
                _type: 'span',
                _key: 'adversarial-span',
                text: 'Sign in',
                marks: [ADVERSARIAL_LINK_KEY],
              },
            ],
          },
        ],
        logoAssetUrl: undefined,
      });

      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(SITE_LINK_HREF),
        }),
      );
    });

    it.each([
      ['a language the tenant offers', '/fr/blog', LOCALE_ISO_CODES.FR],
      ['a language the tenant does not offer', '/de/blog', LOCALE_ISO_CODES.EN],
      ['no language prefix', '/blog', LOCALE_ISO_CODES.EN],
    ])(
      'looks the template up in the right language for a return-to path with %s',
      async (_, callbackPath, expectedLocale) => {
        await sendVerificationRequestFor(provider, {
          url: `${SITE_ORIGIN}/api/auth/callback/email?${new URLSearchParams({
            callbackUrl: `${SITE_ORIGIN}${callbackPath}`,
            token: TOKEN,
          })}`,
        });

        expect(getEmailTemplateMock).toHaveBeenCalledWith(
          'tenant-1',
          EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          expectedLocale,
        );
      },
    );
  });
});
