import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
  SITE_MESSAGES,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
  type TVoicePortableText,
} from '@blog/config';
import { SITE_CONFIG_FETCH_FAILED_EVENT } from '@web/constants/site-config';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantMessages } from './resolve-tenant-messages';

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

const TENANT = { id: 'tenant-1' };

const NOT_FOUND_HEADING_OVERRIDE = 'nope, try again';
const BLOG_LIST_EMPTY_OVERRIDE = 'Nothing published yet.';
const TOPIC_EMPTY_OVERRIDE = 'Nothing here yet.';
const ORIGINAL_HEADING = 'Original heading';

const siteConfigRow = (
  voiceOverrides: Record<string, string | TVoicePortableText> = {},
  locale: TLocaleIsoCode = LOCALE_ISO_CODES.EN,
) => {
  return {
    preset: PRESET_ID.CONSOLE,
    accentHue: 250,
    headingFont: FONT_CHOICE.SPACE_GROTESK,
    bodyFont: FONT_CHOICE.NEWSREADER,
    radiusScale: RADIUS_SCALE.MD,
    density: DENSITY.DEFAULT,
    voiceOverridesByLocale: { [locale]: voiceOverrides },
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
    getSiteConfigMock.mockResolvedValue(siteConfigRow());
  });

  it('returns the base messages unchanged when there are no voice overrides', async () => {
    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('returns the base messages unchanged when the tenant has no site config row', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('applies a TEXT override at its registry path, leaving the rest unchanged', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: NOT_FOUND_HEADING_OVERRIDE }),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(getAtPath(messages, ['notFound', 'heading'])).toBe(
      NOT_FOUND_HEADING_OVERRIDE,
    );
    expect(getAtPath(messages, ['notFound', 'supportingText'])).toBe(
      SITE_MESSAGES.notFound.supportingText,
    );
  });

  it('applies an override saved for the requested language', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: 'Verirrt' }, LOCALE_ISO_CODES.DE),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES_BY_LOCALE.DE,
      LOCALE_ISO_CODES.DE,
    );

    expect(getAtPath(messages, ['notFound', 'heading'])).toBe('Verirrt');
  });

  it('ignores an override saved for another language', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: 'Verirrt' }, LOCALE_ISO_CODES.DE),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES_BY_LOCALE.EN,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES_BY_LOCALE.EN);
  });

  it('a tenant blogListEmpty voice override reaches blogListPage.empty', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: richTextOf(BLOG_LIST_EMPTY_OVERRIDE) }),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(getAtPath(messages, ['blogListPage', 'empty'])).toBe(
      BLOG_LIST_EMPTY_OVERRIDE,
    );
  });

  it('flattens a RICH override to plain text in the message tree', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ topicEmpty: richTextOf(TOPIC_EMPTY_OVERRIDE) }),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(getAtPath(messages, ['topicPage', 'empty'])).toBe(
      TOPIC_EMPTY_OVERRIDE,
    );
  });

  it('ignores an override key missing from the VOICE_FIELDS registry', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notARealVoiceField: 'ignored' }),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES);
  });

  it('forwards an explicit tenant to getSiteConfig, through to getRequestTenantId', async () => {
    await resolveTenantMessages(SITE_MESSAGES, LOCALE_ISO_CODES.EN, 'tenant-2');

    expect(getRequestTenantIdMock).toHaveBeenCalledWith('tenant-2');
  });

  it('falls back to the base messages when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error('boom'));

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SITE_CONFIG_FETCH_FAILED_EVENT,
      { error: expect.any(Error) },
    );
  });

  it('does not mutate the source object at the overridden path', async () => {
    const base = { notFound: { heading: ORIGINAL_HEADING } };
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ notFoundHeading: 'Overridden heading' }),
    );

    await resolveTenantMessages(base, LOCALE_ISO_CODES.EN);

    expect(base.notFound.heading).toBe(ORIGINAL_HEADING);
  });

  it('flattens a TEXT-kind override stored as Portable Text to plain text', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ localeErrorTitle: richTextOf('Oops') }),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(getAtPath(messages, ['localeErrorPage', 'title'])).toBe('Oops');
  });

  it('returns a RICH override unflattened in the rich map, keyed by voice field id', async () => {
    const override = richTextOf(BLOG_LIST_EMPTY_OVERRIDE);
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: override }),
    );

    const { rich } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(rich.blogListEmpty).toBe(override);
  });

  it('falls back to the catalog default paragraph for a RICH field with no override', async () => {
    const { rich } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

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
