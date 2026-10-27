import { MagicLinkSendLimitedError } from '@blog/auth/providers/magic-link/magic-link-send-limited-error/magic-link-send-limited-error';
import {
  MOCK_COMMA_NAME,
  MOCK_DB_ERROR_MESSAGE,
  MOCK_FRENCH_PATH,
  MOCK_FROM_ADDRESS,
  MOCK_FROM_EMAIL,
  MOCK_POSTAL_ADDRESS,
  MOCK_READER_EMAIL,
  MOCK_REPLY_TO,
  MOCK_SENDER_NAME,
  MOCK_SITE_CONFIG,
  MOCK_SUBJECT,
  MOCK_TEMPLATE_LOGO_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_LOGO_URL,
  MOCK_TENANT_NAME,
  MOCK_TOKEN,
  mockEmailConfig,
  mockEmailTemplate,
  mockPendingInvite,
  mockTenant,
} from '@blog/auth/testing/magic-link-fixtures';
import { resolveTenantEmailBrand } from '@blog/config';
import {
  AUTH_APP,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  MAGIC_LINK_REFUSAL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';
import { PLATFORM_EMAIL_BRAND_NAME, type TSendEmailInput } from '@blog/email';
import { faker } from '@faker-js/faker';

import {
  buildMagicLinkProvider,
  MAGIC_LINK_PROVIDER_ID,
} from './magic-link-provider';

faker.seed(6027);

const MAGIC_LINK_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK];
const TENANT_INVITE_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.TENANT_INVITE];

const MOCK_SITE_ORIGIN = faker.internet.url({ appendSlash: false });
const MOCK_PLATFORM_ORIGIN = faker.internet.url({ appendSlash: false });
const MOCK_INVITED_EMAIL = faker.internet.exampleEmail();
const MOCK_ADMIN_EMAIL = faker.internet.exampleEmail();
const MOCK_LINK_EXPIRES = faker.date.future();
const MOCK_AUTHORED_BODY_TEXT = faker.lorem.sentence();
const MOCK_PHISHING_URL = faker.internet.url();
const MIMICKED_ACTION_LABEL = 'Sign in';
const PLATFORM_LAYOUT_MARK = `>${PLATFORM_EMAIL_BRAND_NAME}</td>`;
const COPYRIGHT_MARK = '&copy;';
const BLOCKED_REFUSAL = { reason: MAGIC_LINK_REFUSAL.BLOCKED };
const LIMIT_REFUSAL = { reason: MAGIC_LINK_REFUSAL.ADDRESS_LIMIT };

const callbackUrlOn = (origin: string, callbackPath?: string) =>
  `${origin}/api/auth/callback/email?${new URLSearchParams({
    ...(callbackPath && { callbackUrl: `${origin}${callbackPath}` }),
    token: MOCK_TOKEN,
  })}`;

const SITE_CALLBACK_URL = callbackUrlOn(MOCK_SITE_ORIGIN);
const PLATFORM_CALLBACK_URL = callbackUrlOn(MOCK_PLATFORM_ORIGIN);
const SITE_LINK_HREF = `href="${SITE_CALLBACK_URL}"`;
const DEFAULT_ENVELOPE = {
  to: MOCK_READER_EMAIL,
  from: MOCK_FROM_ADDRESS,
  subject: MAGIC_LINK_DEFAULTS.subject,
};

const mockAuthoredBlock = (
  text: string,
  markDefs: { _type: string; _key: string; href: string }[] = [],
) => ({
  _type: 'block',
  _key: faker.string.uuid(),
  style: 'normal',
  markDefs,
  children: [
    {
      _type: 'span',
      _key: faker.string.uuid(),
      text,
      marks: markDefs.map(({ _key }) => _key),
    },
  ],
});

const defaultCopyIn = (locale: TLocaleIsoCode, templateType: string) =>
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][
    templateType as keyof (typeof EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE)[TLocaleIsoCode]
  ];

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
    expires: MOCK_LINK_EXPIRES,
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

const buildPlatformProvider = () =>
  buildMagicLinkProvider(AUTH_APP.PLATFORM, onSendRefusedMock);

const withPendingInvite = (locale: TLocaleIsoCode = LOCALE_ISO_CODES.EN) => {
  findPendingInviteByEmailMock.mockResolvedValue([mockPendingInvite()]);
  listTenantsByIdsMock.mockResolvedValue([mockTenant({ locale })]);
};

describe(buildMagicLinkProvider, () => {
  let provider: ReturnType<typeof buildMagicLinkProvider>;

  beforeEach(() => {
    vi.stubEnv('MAGIC_LINK_FROM_ADDRESS', MOCK_FROM_ADDRESS);
    findPendingInviteByEmailMock.mockResolvedValue([]);
    getTenantByDomainMock.mockResolvedValue(undefined);
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
    sendEmailMock.mockResolvedValue(undefined);
    findMagicLinkSendRefusalMock.mockResolvedValue(undefined);
    withMinimumDurationMock.mockImplementation(
      (_minimumMs: number, task: () => Promise<unknown>) => task(),
    );
    provider = buildMagicLinkProvider(AUTH_APP.SITE, onSendRefusedMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('identifies itself as the magic-link provider', () => {
    expect(provider.id).toBe(MAGIC_LINK_PROVIDER_ID);
  });

  it('advertises the configured from address', () => {
    expect(provider.from).toBe(MOCK_FROM_ADDRESS);
  });

  describe('when the send check blocks the request', () => {
    beforeEach(() => {
      findMagicLinkSendRefusalMock.mockResolvedValue(BLOCKED_REFUSAL);
    });

    it('sends nothing', async () => {
      await sendVerificationRequestFor(provider);

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it("hands the refusal to the app's handler", async () => {
      await sendVerificationRequestFor(provider);

      expect(onSendRefusedMock).toHaveBeenCalledExactlyOnceWith(
        BLOCKED_REFUSAL,
      );
    });
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
    findMagicLinkSendRefusalMock.mockResolvedValue(BLOCKED_REFUSAL);
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

  it('delivers the sign-in link from the configured address', async () => {
    await sendVerificationRequestFor(provider);

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual(DEFAULT_ENVELOPE);
    expect(html).toContain(SITE_LINK_HREF);
  });

  it('sends invite copy to a platform address with a pending invite', async () => {
    withPendingInvite();

    await sendVerificationRequestFor(buildPlatformProvider(), {
      identifier: MOCK_INVITED_EMAIL,
    });

    const { to, from, subject, html } = sentEmail();
    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(
      MOCK_INVITED_EMAIL,
    );
    expect([to, from, subject]).toEqual([
      MOCK_INVITED_EMAIL,
      MOCK_FROM_ADDRESS,
      TENANT_INVITE_DEFAULTS.subject,
    ]);
    expect(html).toContain(MOCK_TENANT_NAME);
  });

  it("sends a site's own sign-in email to an address with a pending invite", async () => {
    withPendingInvite();

    await sendVerificationRequestFor(provider, {
      identifier: MOCK_INVITED_EMAIL,
    });

    const { subject, html } = sentEmail();
    expect(subject).toBe(MAGIC_LINK_DEFAULTS.subject);
    expect(html).not.toContain(MOCK_TENANT_NAME);
  });

  it('falls back to the generic copy when the invite lookup throws', async () => {
    findPendingInviteByEmailMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    await sendVerificationRequestFor(buildPlatformProvider());

    const { html, ...envelope } = sentEmail();
    expect(envelope).toEqual(DEFAULT_ENVELOPE);
    expect(html).toContain(SITE_LINK_HREF);
  });

  it.each([
    ['sign-in', () => {}, MAGIC_LINK_DEFAULTS.subject],
    ['invite', () => withPendingInvite(), TENANT_INVITE_DEFAULTS.subject],
  ])(
    "sends the admin's %s email in the platform layout",
    async (_, arrange, expectedSubject) => {
      arrange();

      await sendVerificationRequestFor(buildPlatformProvider(), {
        identifier: MOCK_ADMIN_EMAIL,
        url: PLATFORM_CALLBACK_URL,
      });

      const { subject, html } = sentEmail();
      expect(subject).toBe(expectedSubject);
      expect(html).toContain(PLATFORM_LAYOUT_MARK);
    },
  );

  it("never sends a site's sign-in email in the platform layout", async () => {
    await sendVerificationRequestFor(provider);

    expect(sentEmail().html).not.toContain(PLATFORM_EMAIL_BRAND_NAME);
  });

  it.each([
    ['resolves to no tenant', () => {}],
    [
      'lookup throws',
      () =>
        getTenantByDomainMock.mockRejectedValue(
          new Error(MOCK_DB_ERROR_MESSAGE),
        ),
    ],
  ])(
    'still delivers, in the unnamed neutral shell, when the host %s',
    async (_, arrange) => {
      arrange();

      await sendVerificationRequestFor(provider);

      const { html, ...envelope } = sentEmail();
      expect(envelope).toEqual(DEFAULT_ENVELOPE);
      expect(html).not.toContain(COPYRIGHT_MARK);
    },
  );

  it("writes a tenant-less invite in the invited tenant's default language", async () => {
    withPendingInvite(LOCALE_ISO_CODES.ES);

    await sendVerificationRequestFor(buildPlatformProvider(), {
      identifier: MOCK_INVITED_EMAIL,
      url: PLATFORM_CALLBACK_URL,
    });

    expect(sentEmail().subject).toBe(
      defaultCopyIn(LOCALE_ISO_CODES.ES, EMAIL_TEMPLATE_TYPE.TENANT_INVITE)
        .subject,
    );
  });

  it('writes a tenant-less sign-in in English whatever the return-to path', async () => {
    await sendVerificationRequestFor(provider, {
      identifier: MOCK_ADMIN_EMAIL,
      url: callbackUrlOn(
        MOCK_PLATFORM_ORIGIN,
        `/${LOCALE_BCP47_TAGS[LOCALE_ISO_CODES.FR]}`,
      ),
    });

    expect(sentEmail().subject).toBe(
      defaultCopyIn(LOCALE_ISO_CODES.EN, EMAIL_TEMPLATE_TYPE.MAGIC_LINK)
        .subject,
    );
  });

  describe('when the host resolves to a tenant', () => {
    beforeEach(() => {
      getTenantByDomainMock.mockResolvedValue(
        mockTenant({ additionalLocales: [LOCALE_ISO_CODES.FR] }),
      );
      getSiteConfigMock.mockResolvedValue(MOCK_SITE_CONFIG);
    });

    it("brands the sign-in email with the resolved tenant's hue", async () => {
      await sendVerificationRequestFor(provider);

      const { logo1 } = resolveTenantEmailBrand(MOCK_SITE_CONFIG);
      expect(sentEmail().html).toContain(logo1);
    });

    it("applies the tenant's sender name and reply-to address", async () => {
      getEmailConfigMock.mockResolvedValue(
        mockEmailConfig({
          senderName: MOCK_SENDER_NAME,
          replyToAddress: MOCK_REPLY_TO,
        }),
      );

      await sendVerificationRequestFor(provider);

      const { from, replyTo } = sentEmail();
      expect(from).toBe(`"${MOCK_SENDER_NAME}" <${MOCK_FROM_EMAIL}>`);
      expect(replyTo).toBe(MOCK_REPLY_TO);
    });

    it('renders the resolved logo and footer postal address in the sent email', async () => {
      getEmailConfigMock.mockResolvedValue(
        mockEmailConfig({
          logoAssetUrl: MOCK_TENANT_LOGO_URL,
          footerPostalAddress: MOCK_POSTAL_ADDRESS,
        }),
      );
      getEmailTemplateMock.mockResolvedValue(
        mockEmailTemplate({ logoAssetUrl: MOCK_TEMPLATE_LOGO_URL }),
      );

      await sendVerificationRequestFor(provider);

      const { html } = sentEmail();
      expect(html).toContain(`src="${MOCK_TEMPLATE_LOGO_URL}"`);
      expect(html).toContain(MOCK_POSTAL_ADDRESS);
    });

    it.each([
      ['has no sender name', () => {}],
      [
        'has a sender name of only spaces',
        () =>
          getEmailConfigMock.mockResolvedValue(
            mockEmailConfig({ senderName: '   ' }),
          ),
      ],
      [
        'email config lookup fails',
        () =>
          getEmailConfigMock.mockRejectedValue(
            new Error(MOCK_DB_ERROR_MESSAGE),
          ),
      ],
    ])(
      "sends as the site's name, with no reply-to, when the tenant %s",
      async (_, arrange) => {
        arrange();

        await sendVerificationRequestFor(provider);

        const { from, replyTo } = sentEmail();
        expect(from).toBe(`"${MOCK_TENANT_NAME}" <${MOCK_FROM_EMAIL}>`);
        expect(replyTo).toBeUndefined();
      },
    );

    it("keeps a comma in the site's name inside the From display name", async () => {
      getTenantByDomainMock.mockResolvedValue(
        mockTenant({ name: MOCK_COMMA_NAME }),
      );

      await sendVerificationRequestFor(provider);

      expect(sentEmail().from).toBe(
        `"${MOCK_COMMA_NAME}" <${MOCK_FROM_EMAIL}>`,
      );
    });

    it('still delivers with product defaults when the email-template lookup fails', async () => {
      getEmailConfigMock.mockResolvedValue(
        mockEmailConfig({ senderName: MOCK_SENDER_NAME }),
      );
      getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      await sendVerificationRequestFor(provider);

      const { from, subject } = sentEmail();
      expect(from).toBe(`"${MOCK_SENDER_NAME}" <${MOCK_FROM_EMAIL}>`);
      expect(subject).toBe(MAGIC_LINK_DEFAULTS.subject);
    });

    it('sends the authored subject and body once a tenant has edited its copy', async () => {
      getEmailTemplateMock.mockResolvedValue(
        mockEmailTemplate({
          subject: MOCK_SUBJECT,
          body: [mockAuthoredBlock(MOCK_AUTHORED_BODY_TEXT)],
        }),
      );

      await sendVerificationRequestFor(provider);

      const { subject, html } = sentEmail();
      expect(subject).toBe(MOCK_SUBJECT);
      expect(html).toContain(MOCK_AUTHORED_BODY_TEXT);
    });

    it('keeps the sign-in action outside an authored body that mimics it', async () => {
      getEmailTemplateMock.mockResolvedValue(
        mockEmailTemplate({
          body: [
            mockAuthoredBlock(MIMICKED_ACTION_LABEL, [
              {
                _type: 'link',
                _key: faker.string.uuid(),
                href: MOCK_PHISHING_URL,
              },
            ]),
          ],
        }),
      );

      await sendVerificationRequestFor(provider);

      expect(sentEmail().html).toContain(SITE_LINK_HREF);
    });

    it.each([
      ['a language the tenant offers', MOCK_FRENCH_PATH, LOCALE_ISO_CODES.FR],
      ['a language the tenant does not offer', '/de/blog', LOCALE_ISO_CODES.EN],
      ['no language prefix', '/blog', LOCALE_ISO_CODES.EN],
    ])(
      'looks the template up in the right language for a path with %s',
      async (_, callbackPath, expectedLocale) => {
        await sendVerificationRequestFor(provider, {
          url: callbackUrlOn(MOCK_SITE_ORIGIN, callbackPath),
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
