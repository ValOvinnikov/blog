import { SITE_MESSAGES, type TVoicePortableText } from '@blog/config';

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

const siteConfigRow = (
  voiceOverrides: Record<string, string | TVoicePortableText> = {},
) => {
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

const richTextOf = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text }],
  },
];

describe('resolveTenantMessages', () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT.id);
  });

  it('returns the base messages unchanged when there are no voice overrides', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow());

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('returns the base messages unchanged when no site config row exists for the tenant', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('applies a TEXT override at its registry path, leaving the rest unchanged', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: 'nope, try again' }),
    );

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(getAtPath(messages, ['notFound', 'heading'])).toBe(
      'nope, try again',
    );
    expect(getAtPath(messages, ['notFound', 'supportingText'])).toBe(
      SITE_MESSAGES.notFound.supportingText,
    );
  });

  it('a tenant blogListEmpty voice override reaches blogListPage.empty', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: richTextOf('Nothing published yet.') }),
    );

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(getAtPath(messages, ['blogListPage', 'empty'])).toBe(
      'Nothing published yet.',
    );
  });

  it('flattens a RICH override to plain text in the message tree', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ topicEmpty: richTextOf('Nothing here yet.') }),
    );

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(getAtPath(messages, ['topicPage', 'empty'])).toBe(
      'Nothing here yet.',
    );
  });

  it('ignores an override key absent from the VOICE_FIELDS registry rather than throwing', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notARealVoiceField: 'ignored' }),
    );

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('forwards an explicitly supplied tenant to getSiteConfig, through to getRequestTenantId', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow());

    await resolveTenantMessages(SITE_MESSAGES, 'tenant-2');

    expect(getRequestTenantIdMock).toHaveBeenCalledWith('tenant-2');
  });

  it('falls back to the base messages with no overrides when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error('boom'));
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(messages).toEqual(SITE_MESSAGES);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('does not mutate the source object at the overridden path', async () => {
    const base = { notFound: { heading: 'Original heading' } };
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: 'Overridden heading' }),
    );

    await resolveTenantMessages(base);

    expect(base.notFound.heading).toBe('Original heading');
  });

  it('flattens a TEXT-kind override to plain text when its stored value is Portable Text', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ paginationPrevious: richTextOf('Prev') }),
    );

    const { messages } = await resolveTenantMessages(SITE_MESSAGES);

    expect(getAtPath(messages, ['pagination', 'previous'])).toBe('Prev');
  });

  it('returns a RICH override unflattened in the rich map, keyed by voice field id', async () => {
    const override = richTextOf('Nothing published yet.');
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: override }),
    );

    const { rich } = await resolveTenantMessages(SITE_MESSAGES);

    expect(rich.blogListEmpty).toBe(override);
  });

  it('falls back the rich map to the catalog default wrapped as one paragraph when a RICH field has no override', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow());

    const { rich } = await resolveTenantMessages(SITE_MESSAGES);

    expect(rich.blogListEmpty).toEqual([
      {
        _type: 'block',
        _key: 'catalog-block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'catalog-span',
            text: SITE_MESSAGES.blogListPage.empty,
          },
        ],
      },
    ]);
  });
});
