import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELDS,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { peekVoiceTenant } from '@web/server/request-context/request-context';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { createTranslator } from 'next-intl';

import requestConfig from './request';
import { routing } from './routing';

const NOT_FOUND_HEADING_KEY = 'notFound.heading';

vi.mock('next-intl/server', () => ({
  getRequestConfig: (fn: unknown) => fn,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

const TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

const OVERRIDES = Object.fromEntries(
  VOICE_FIELDS.map((field) => [field.id, `Tenant copy for ${field.id}`]),
);

const resolveConfig = (locale: string) =>
  requestConfig({ requestLocale: Promise.resolve(locale) });

const translateAt = (messages: unknown, path: string) => {
  const segments = path.split('.');
  const key = segments.pop() as string;
  const t = createTranslator({
    locale: 'en',
    messages: messages as Record<string, unknown>,
    namespace: segments.join('.') as never,
  });
  return t.raw(key as never);
};

describe('i18n request config', () => {
  beforeEach(() => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: OVERRIDES },
      }) as never,
    );
  });

  it('resolves the base locale messages for a supported requestLocale', async () => {
    const config = await resolveConfig(LOCALE_ISO_CODES.EN);

    expect(config.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(config.messages).toBe(SITE_MESSAGES_BY_LOCALE.EN);
  });

  it('falls back to the default locale when requestLocale is unsupported', async () => {
    const config = await resolveConfig('xx');

    expect(config.locale).toBe(routing.defaultLocale);
  });

  it('never reads a site config when no tenant voice applies', async () => {
    await resolveConfig(LOCALE_ISO_CODES.EN);

    expect(getSiteConfig).not.toHaveBeenCalled();
  });

  describe('with a tenant voice', () => {
    beforeEach(() => {
      vi.mocked(peekVoiceTenant).mockResolvedValue(TENANT_ID);
    });

    it.each(VOICE_FIELDS.map((field) => [field.id, field.path]))(
      'serves the %s override to server-rendered translations',
      async (id, path) => {
        const { messages } = await resolveConfig(LOCALE_ISO_CODES.EN);

        expect(translateAt(messages, path)).toBe(OVERRIDES[id]);
      },
    );

    it('serves the catalog default for a key with no override', async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        okResult({ voiceOverridesByLocale: {} }) as never,
      );

      const { messages } = await resolveConfig(LOCALE_ISO_CODES.EN);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe(
        'Page not found',
      );
    });

    it("serves another language's own overrides and not the default language's", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        okResult({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'Lost' },
            [LOCALE_ISO_CODES.DE]: { notFoundHeading: 'Verirrt' },
          },
        }) as never,
      );

      const { messages } = await resolveConfig(LOCALE_ISO_CODES.DE);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe('Verirrt');
    });

    it("serves a language's catalog default when only another language has an override", async () => {
      const { messages } = await resolveConfig(LOCALE_ISO_CODES.DE);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe(
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
    });
  });
});
