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
  VOICE_FIELD_KIND,
} from '@blog/config';
import { SITE_CONFIG_FETCH_FAILED_EVENT } from '@web/constants/site-config';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_OTHER_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
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

const NOT_FOUND_HEADING_OVERRIDE = 'nope, try again';
const GERMAN_HEADING_OVERRIDE = 'Verirrt';
const BLOG_LIST_EMPTY_OVERRIDE = 'Nothing published yet.';
const TOPIC_EMPTY_OVERRIDE = 'Nothing here yet.';
const LOCALE_ERROR_TITLE_OVERRIDE = 'Oops';
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

describe(resolveTenantMessages, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(siteConfigRow());
  });

  it.each([
    { case: 'there are no voice overrides', row: siteConfigRow() },
    { case: 'the tenant has no site config row', row: undefined },
    {
      case: 'an override key is missing from the VOICE_FIELDS registry',
      row: siteConfigRow({ notARealVoiceField: 'ignored' }),
    },
    {
      case: 'the only override is saved for another language',
      row: siteConfigRow(
        { notFoundHeading: GERMAN_HEADING_OVERRIDE },
        LOCALE_ISO_CODES.DE,
      ),
    },
  ])('returns the base messages unchanged when $case', async ({ row }) => {
    getSiteConfigMock.mockResolvedValue(row);

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES_BY_LOCALE.EN,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES_BY_LOCALE.EN);
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
      siteConfigRow(
        { notFoundHeading: GERMAN_HEADING_OVERRIDE },
        LOCALE_ISO_CODES.DE,
      ),
    );

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES_BY_LOCALE.DE,
      LOCALE_ISO_CODES.DE,
    );

    expect(getAtPath(messages, ['notFound', 'heading'])).toBe(
      GERMAN_HEADING_OVERRIDE,
    );
  });

  it.each<{
    kind: string;
    overrides: Record<string, TVoicePortableText>;
    path: string[];
    text: string;
  }>([
    {
      kind: VOICE_FIELD_KIND.RICH,
      overrides: { blogListEmpty: mockVoiceRichText(BLOG_LIST_EMPTY_OVERRIDE) },
      path: ['blogListPage', 'empty'],
      text: BLOG_LIST_EMPTY_OVERRIDE,
    },
    {
      kind: VOICE_FIELD_KIND.RICH,
      overrides: { topicEmpty: mockVoiceRichText(TOPIC_EMPTY_OVERRIDE) },
      path: ['topicPage', 'empty'],
      text: TOPIC_EMPTY_OVERRIDE,
    },
    {
      kind: VOICE_FIELD_KIND.TEXT,
      overrides: {
        localeErrorTitle: mockVoiceRichText(LOCALE_ERROR_TITLE_OVERRIDE),
      },
      path: ['localeErrorPage', 'title'],
      text: LOCALE_ERROR_TITLE_OVERRIDE,
    },
  ])(
    'flattens a Portable Text $kind override at $path to plain text',
    async ({ overrides, path, text }) => {
      getSiteConfigMock.mockResolvedValue(siteConfigRow(overrides));

      const { messages } = await resolveTenantMessages(
        SITE_MESSAGES,
        LOCALE_ISO_CODES.EN,
      );

      expect(getAtPath(messages, path)).toBe(text);
    },
  );

  it('forwards an explicit tenant to getRequestTenantId', async () => {
    await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
      MOCK_OTHER_TENANT_ID,
    );

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
  });

  it('falls back to the base messages when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    const { messages } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(messages).toEqual(SITE_MESSAGES);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SITE_CONFIG_FETCH_FAILED_EVENT,
      { error: MOCK_ERROR },
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

  it('returns a RICH override unflattened in the rich map, keyed by voice field id', async () => {
    const override = mockVoiceRichText(BLOG_LIST_EMPTY_OVERRIDE);
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow({ blogListEmpty: override }),
    );

    const { rich } = await resolveTenantMessages(
      SITE_MESSAGES,
      LOCALE_ISO_CODES.EN,
    );

    expect(rich.blogListEmpty).toBe(override);
  });
});
