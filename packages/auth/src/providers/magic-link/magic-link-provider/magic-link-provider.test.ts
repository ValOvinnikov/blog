import { MagicLinkSendLimitedError } from '@blog/auth/providers/magic-link/magic-link-send-limited-error/magic-link-send-limited-error';
import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_FRENCH_PATH,
  MOCK_FROM_ADDRESS,
  MOCK_INVITE_ID,
  MOCK_POSTAL_ADDRESS,
  MOCK_READER_EMAIL,
  MOCK_REPLY_TO,
  MOCK_SENDER_FROM_ADDRESS,
  MOCK_SENDER_NAME,
  MOCK_SUBJECT,
  MOCK_TEMPLATE_LOGO_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_LOGO_URL,
  MOCK_TENANT_NAME,
  MOCK_TOKEN,
} from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_EMAIL } from '@blog/auth/testing/session-fixtures';
import { resolveTenantEmailBrand } from '@blog/config';
import {
  AUTH_APP,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  MAGIC_LINK_REFUSAL,
  PRESET_ID,
} from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
  TENANT_PLAN,
} from '@blog/db/constants';
import type { TSendEmailInput } from '@blog/email';

import { buildMagicLinkProvider } from './magic-link-provider';

const MAGIC_LINK_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK];
const TENANT_INVITE_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.TENANT_INVITE];

const SITE_ORIGIN = 'https://example.com';
const PLATFORM_ORIGIN = 'https://platform.example.com';
const INVITED_EMAIL = 'invited@example.com';
const ADMIN_EMAIL = 'admin@example.com';
const SITE_CALLBACK_URL = `${SITE_ORIGIN}/api/auth/callback/email?token=${MOCK_TOKEN}`;
const PLATFORM_CALLBACK_URL = `${PLATFORM_ORIGIN}/api/auth/callback/email?token=${MOCK_TOKEN}`;
const PLATFORM_LAYOUT_MARK = '>Platform</td>';
const COPYRIGHT_MARK = '&copy;';
const CUSTOM_BODY_TEXT = 'Use the button below to get back in.';
const ADVERSARIAL_LINK_KEY = 'adversarial-link';
const SITE_LINK_HREF = `href="${SITE_CALLBACK_URL}"`;
const REFUSAL = { reason: MAGIC_LINK_REFUSAL.BLOCKED };
const LIMIT_REFUSAL = { reason: MAGIC_LINK_REFUSAL.ADDRESS_LIMIT };

function sendVerificationRequestFor(
  provider: ReturnType<typeof buildMagicLinkProvider>,
  {
    identifier = MOCK_READER_EMAIL,
    url = SITE_CALLBACK_URL,
  }: { identifier?: string; url?: string } = {},
) {
  return provider.sendVerificationRequest({
    identifier,
    url,
    expires: new Date('2026-01-01T00:00:00.000Z'),
    provider,
    token: MOCK_TOKEN,
    theme: {},
    request: new Request(new URL(url).origin),
  });
}

function sentEmail(): TSendEmailInput {
  const email = sendEmailMock.mock.calls[0]?.[0];
  if (!email) {
    throw new Error('sendEmail was not called');
  }

  return email;
}

const {
  findPendingInviteByEmailMock,
  listTenantsByIdsMock,
  getTenantByDomainMock,
  getSiteConfigMock,
  getEmailConfigMock,
  getEmailTemplateMock,
  sendEmailMock,
  findMagicLinkSendRefusalMock,
  withMinimumDurationMock,
  onSendRefusedMock,
} = vi.hoisted(() => ({
  findPendingInviteByEmailMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  sendEmailMock: vi.fn<(input: TSendEmailInput) => Promise<void>>(),
  findMagicLinkSendRefusalMock: vi.fn(),
  withMinimumDurationMock: vi.fn(),
  onSendRefusedMock: vi.fn(),
}));

vi.mock(
  '@blog/auth/providers/magic-link/find-magic-link-send-refusal/find-magic-link-send-refusal',
  () => ({ findMagicLinkSendRefusal: findMagicLinkSendRefusalMock }),
);

vi.mock('@blog/auth/utils/with-minimum-duration/with-minimum-duration', () => ({
  withMinimumDuration: withMinimumDurationMock,
}));

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
    findMagicLinkSendRefusalMock.mockResolvedValue(undefined);
    onSendRefusedMock.mockReset();
    withMinimumDurationMock.mockImplementation(
      (_minimumMs: number, task: () => Promise<unknown>) => task(),
    );
    provider = buildMagicLinkProvider(AUTH_APP.SITE, onSendRefusedMock);
  });

  it('sends nothing once the send check refuses the request', async () => {
    findMagicLinkSendRefusalMock.mockResolvedValue(REFUSAL);

    await sendVerificationRequestFor(provider);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("hands the refusal to the app's handler", async () => {
    findMagicLinkSendRefusalMock.mockResolvedValue(REFUSAL);

    await sendVerificationRequestFor(provider);

    expect(onSendRefusedMock).toHaveBeenCalledExactlyOnceWith(REFUSAL);
  });

  it('reports no refusal for a link it sends', async () => {
    await sendVerificationRequestFor(provider);

    expect(onSendRefusedMock).not.toHaveBeenCalled();
  });

  it.each([MAGIC_LINK_REFUSAL.BLOCKED, MAGIC_LINK_REFUSAL.CHECK_FAILED])(
    'resolves a %s refusal as it resolves a real send',
    async (reason) => {
      findMagicLinkSendRefusalMock.mockResolvedValue({ reason });

      await expect(
        sendVerificationRequestFor(provider),
      ).resolves.toBeUndefined();
    },
  );

  it.each([MAGIC_LINK_REFUSAL.NETWORK_LIMIT, MAGIC_LINK_REFUSAL.ADDRESS_LIMIT])(
    'rejects a %s refusal as a send limit, sending nothing',
    async (reason) => {
      findMagicLinkSendRefusalMock.mockResolvedValue({ reason });

      await expect(sendVerificationRequestFor(provider)).rejects.toBeInstanceOf(
        MagicLinkSendLimitedError,
      );
      expect(sendEmailMock).not.toHaveBeenCalled();
    },
  );

  it("hands a send-limit refusal to the app's handler before rejecting", async () => {
    findMagicLinkSendRefusalMock.mockResolvedValue(LIMIT_REFUSAL);

    await expect(sendVerificationRequestFor(provider)).rejects.toThrow();

    expect(onSendRefusedMock).toHaveBeenCalledExactlyOnceWith(LIMIT_REFUSAL);
  });

  it('holds a refused request to the same minimum duration as a real send', async () => {
    await sendVerificationRequestFor(provider);
    findMagicLinkSendRefusalMock.mockResolvedValue(REFUSAL);
    await sendVerificationRequestFor(provider);

    const [sentFloorMs, refusedFloorMs] =
      withMinimumDurationMock.mock.calls.map(([minimumMs]) => minimumMs);
    expect(refusedFloorMs).toBe(sentFloorMs);
    expect(refusedFloorMs).toBeGreaterThan(0);
  });

  it('checks the requested address before sending', async () => {
    await sendVerificationRequestFor(provider);

    const [address, request] = findMagicLinkSendRefusalMock.mock.calls[0] ?? [];
    expect(address).toBe(MOCK_READER_EMAIL);
    expect(request).toBeInstanceOf(Request);
  });

  it('identifies itself as the email provider', () => {
    expect(provider.id).toBe('email');
    expect(provider.type).toBe('email');
  });

  it('resolves the from address via resolveMagicLinkFromAddress', () => {
    expect(provider.from).toBe(MOCK_FROM_ADDRESS);
  });

  it("delivers the sign-in link through @blog/email's sendEmail", async () => {
    await sendVerificationRequestFor(provider);

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual({
      to: MOCK_READER_EMAIL,
      from: MOCK_FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
    });
    expect(html).toContain(SITE_LINK_HREF);
  });

  it('sends invite-flavored copy when the identifier has a pending invite', async () => {
    const provider = buildMagicLinkProvider(
      AUTH_APP.PLATFORM,
      onSendRefusedMock,
    );
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      {
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        locale: LOCALE_ISO_CODES.EN,
      },
    ]);

    await sendVerificationRequestFor(provider, { identifier: INVITED_EMAIL });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(INVITED_EMAIL);
    const { to, from, subject, html } = sentEmail();
    expect(to).toBe(INVITED_EMAIL);
    expect(from).toBe(MOCK_FROM_ADDRESS);
    expect(subject).toBe(TENANT_INVITE_DEFAULTS.subject);
    expect(html).toContain('Accept invite');
    expect(html).toContain(`<strong>${MOCK_TENANT_NAME}</strong>`);
  });

  it("sends a site's own sign-in email to an address with a pending invite", async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      {
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        locale: LOCALE_ISO_CODES.EN,
      },
    ]);

    await sendVerificationRequestFor(provider, { identifier: INVITED_EMAIL });

    const { subject, html } = sentEmail();
    expect(subject).toBe(MAGIC_LINK_DEFAULTS.subject);
    expect(html).not.toContain(MOCK_TENANT_NAME);
  });

  it('falls back to the generic copy and still delivers when the invite lookup throws', async () => {
    const provider = buildMagicLinkProvider(
      AUTH_APP.PLATFORM,
      onSendRefusedMock,
    );
    findPendingInviteByEmailMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    await sendVerificationRequestFor(provider);

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual({
      to: MOCK_READER_EMAIL,
      from: MOCK_FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
    });
    expect(html).toContain(SITE_LINK_HREF);
  });

  it("sends the admin's sign-in email in the platform layout", async () => {
    const provider = buildMagicLinkProvider(
      AUTH_APP.PLATFORM,
      onSendRefusedMock,
    );

    await sendVerificationRequestFor(provider, {
      identifier: ADMIN_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    const { subject, html } = sentEmail();
    expect(subject).toBe(MAGIC_LINK_DEFAULTS.subject);
    expect(html).toContain(PLATFORM_LAYOUT_MARK);
  });

  it("sends the admin's invite email in the platform layout", async () => {
    const provider = buildMagicLinkProvider(
      AUTH_APP.PLATFORM,
      onSendRefusedMock,
    );
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      {
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        locale: LOCALE_ISO_CODES.EN,
      },
    ]);

    await sendVerificationRequestFor(provider, {
      identifier: INVITED_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    const { subject, html } = sentEmail();
    expect(subject).toBe(TENANT_INVITE_DEFAULTS.subject);
    expect(html).toContain(PLATFORM_LAYOUT_MARK);
  });

  it("never sends a site's sign-in email in the platform layout", async () => {
    await sendVerificationRequestFor(provider);

    expect(sentEmail().html).not.toContain('Platform');
  });

  it('still delivers, in the unnamed neutral shell, when the host resolves to no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    await sendVerificationRequestFor(provider);

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual({
      to: MOCK_READER_EMAIL,
      from: MOCK_FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
    });
    expect(html).not.toContain(COPYRIGHT_MARK);
  });

  it('still delivers, in the unnamed neutral shell, when the tenant domain lookup throws', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    await sendVerificationRequestFor(provider);

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual({
      to: MOCK_READER_EMAIL,
      from: MOCK_FROM_ADDRESS,
      subject: MAGIC_LINK_DEFAULTS.subject,
    });
    expect(html).not.toContain(COPYRIGHT_MARK);
  });

  it("writes an invite sent from a tenant-less host in the invited tenant's default language", async () => {
    const provider = buildMagicLinkProvider(
      AUTH_APP.PLATFORM,
      onSendRefusedMock,
    );
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      {
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        locale: LOCALE_ISO_CODES.ES,
      },
    ]);

    await sendVerificationRequestFor(provider, {
      identifier: MOCK_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    expect(sentEmail().subject).toBe(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.ES][
        EMAIL_TEMPLATE_TYPE.TENANT_INVITE
      ].subject,
    );
  });

  it('writes a sign-in from a tenant-less host in English whatever the return-to path', async () => {
    await sendVerificationRequestFor(provider, {
      identifier: ADMIN_EMAIL,
      url: `${PLATFORM_ORIGIN}/api/auth/callback/email?${new URLSearchParams({
        callbackUrl: `${PLATFORM_ORIGIN}/fr`,
        token: MOCK_TOKEN,
      })}`,
    });

    expect(sentEmail().subject).toBe(
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.EN][
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK
      ].subject,
    );
  });

  describe('when the host resolves to a tenant', () => {
    beforeEach(() => {
      getTenantByDomainMock.mockResolvedValue({
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
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
      expect(sentEmail().html).toContain(expectedBrand.logo1);
    });

    it("applies the tenant's sender name and reply-to address", async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: undefined,
        senderName: MOCK_SENDER_NAME,
        replyToAddress: MOCK_REPLY_TO,
        footerPostalAddress: undefined,
      });

      await sendVerificationRequestFor(provider);

      const { from, replyTo } = sentEmail();
      expect(from).toBe(MOCK_SENDER_FROM_ADDRESS);
      expect(replyTo).toBe(MOCK_REPLY_TO);
    });

    it('renders the resolved logo and footer postal address in the sent email', async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: MOCK_TENANT_LOGO_URL,
        senderName: undefined,
        replyToAddress: undefined,
        footerPostalAddress: MOCK_POSTAL_ADDRESS,
      });
      getEmailTemplateMock.mockResolvedValue({
        logoAssetUrl: MOCK_TEMPLATE_LOGO_URL,
      });

      await sendVerificationRequestFor(provider);

      const { html } = sentEmail();
      expect(html).toContain(`src="${MOCK_TEMPLATE_LOGO_URL}"`);
      expect(html).toContain(MOCK_POSTAL_ADDRESS);
    });

    it('still delivers with product defaults when the email-config lookup fails', async () => {
      getEmailConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      await sendVerificationRequestFor(provider);

      const { from, replyTo } = sentEmail();
      expect(from).toBe(MOCK_FROM_ADDRESS);
      expect(replyTo).toBeUndefined();
    });

    it('still delivers with product defaults when the email-template lookup fails', async () => {
      getEmailConfigMock.mockResolvedValue({
        logoAssetUrl: undefined,
        senderName: MOCK_SENDER_NAME,
        replyToAddress: undefined,
        footerPostalAddress: undefined,
      });
      getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      await sendVerificationRequestFor(provider);

      const { from, subject } = sentEmail();
      expect(from).toBe(MOCK_SENDER_FROM_ADDRESS);
      expect(subject).toBe(MAGIC_LINK_DEFAULTS.subject);
    });

    it('sends the authored subject and body once a tenant has edited its magic-link copy', async () => {
      getEmailTemplateMock.mockResolvedValue({
        subject: MOCK_SUBJECT,
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

      const { subject, html } = sentEmail();
      expect(subject).toBe(MOCK_SUBJECT);
      expect(html).toContain(CUSTOM_BODY_TEXT);
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

      expect(sentEmail().html).toContain(SITE_LINK_HREF);
    });

    it.each([
      ['a language the tenant offers', MOCK_FRENCH_PATH, LOCALE_ISO_CODES.FR],
      ['a language the tenant does not offer', '/de/blog', LOCALE_ISO_CODES.EN],
      ['no language prefix', '/blog', LOCALE_ISO_CODES.EN],
    ])(
      'looks the template up in the right language for a return-to path with %s',
      async (_, callbackPath, expectedLocale) => {
        await sendVerificationRequestFor(provider, {
          url: `${SITE_ORIGIN}/api/auth/callback/email?${new URLSearchParams({
            callbackUrl: `${SITE_ORIGIN}${callbackPath}`,
            token: MOCK_TOKEN,
          })}`,
        });

        expect(getEmailTemplateMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          expectedLocale,
        );
      },
    );
  });
});
