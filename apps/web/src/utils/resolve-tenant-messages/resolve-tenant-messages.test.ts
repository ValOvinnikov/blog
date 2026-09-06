import realMessages from '@web/i18n/messages/en.json';

import { resolveTenantMessages } from './resolve-tenant-messages';

const { getRequestTenantIdMock, getSiteConfigMock } = vi.hoisted(() => ({
  getRequestTenantIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT = { id: 'tenant-1' };

const siteConfigRow = (voiceOverrides: Record<string, string> = {}) => {
  return {
    preset: 'CONSOLE',
    accentHue: 250,
    headingFont: 'SPACE_GROTESK',
    bodyFont: 'NEWSREADER',
    radiusScale: 'MD',
    density: 'DEFAULT',
    voiceOverrides,
  };
};

const getAtPath = (source: unknown, path: readonly string[]): unknown => {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
};

describe('resolveTenantMessages', () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT.id);
  });

  it('returns the base messages unchanged when there are no voice overrides', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow());

    const messages = await resolveTenantMessages(realMessages);

    expect(messages).toEqual(realMessages);
  });

  it('returns the base messages unchanged when no site config row exists for the tenant', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const messages = await resolveTenantMessages(realMessages);

    expect(messages).toEqual(realMessages);
  });

  it('applies a single voice override on top of the base messages, leaving the rest unchanged', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundCommandNotFound: 'nope, try again' }),
    );

    const messages = await resolveTenantMessages(realMessages);

    expect(getAtPath(messages, ['notFound', 'heading'])).toBe(
      'nope, try again',
    );
    expect(getAtPath(messages, ['notFound', 'supportingText'])).toBe(
      (realMessages.notFound as { supportingText: string }).supportingText,
    );
  });

  it('a tenant blogListEmpty voice override reaches blogListPage.empty (#1899)', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: 'Nothing published to the blog yet.' }),
    );

    const messages = await resolveTenantMessages(realMessages);

    expect(getAtPath(messages, ['blogListPage', 'empty'])).toBe(
      'Nothing published to the blog yet.',
    );
  });

  it('forwards an explicitly supplied tenant to getSiteConfig, through to getRequestTenantId', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow());

    await resolveTenantMessages(realMessages, 'tenant-2');

    expect(getRequestTenantIdMock).toHaveBeenCalledWith('tenant-2');
  });

  it('falls back to the base messages with no overrides when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error('boom'));
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const messages = await resolveTenantMessages(realMessages);

    expect(messages).toEqual(realMessages);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
