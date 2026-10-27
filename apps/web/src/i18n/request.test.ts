import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELDS,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { peekVoiceTenant } from '@web/server/request-context/request-context';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { createTranslator } from 'next-intl';

import requestConfig from './request';
import { routing } from './routing';

faker.seed(6012);

const NOT_FOUND_HEADING_KEY = 'notFound.heading';
const NOT_FOUND_HEADING_FIELD_ID = 'notFoundHeading';
const MOCK_UNSUPPORTED_LOCALE = faker.string.alpha(2);
const MOCK_ENGLISH_HEADING = faker.lorem.words(2);
const MOCK_GERMAN_HEADING = faker.lorem.words(2);
const MOCK_OVERRIDES = Object.fromEntries(
  VOICE_FIELDS.map((field) => [field.id, faker.lorem.sentence()]),
);

vi.mock('next-intl/server', () => ({
  getRequestConfig: (fn: unknown) => fn,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

const resolveConfig = (locale: string) =>
  requestConfig({ requestLocale: Promise.resolve(locale) });

const translateAt = (messages: unknown, path: string) => {
  const segments = path.split('.');
  const key = segments.pop() as string;
  const t = createTranslator({
    locale: LOCALE_ISO_CODES.EN,
    messages: messages as Record<string, unknown>,
    namespace: segments.join('.') as never,
  });
  return t.raw(key as never);
};

describe('i18n request config', () => {
  beforeEach(() => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: MOCK_OVERRIDES },
      }) as never,
    );
  });

  it('serves the base messages for a supported locale', async () => {
    const config = await resolveConfig(LOCALE_ISO_CODES.EN);

    expect(config.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(config.messages).toBe(SITE_MESSAGES_BY_LOCALE.EN);
  });

  it('falls back to the default locale for an unsupported one', async () => {
    const config = await resolveConfig(MOCK_UNSUPPORTED_LOCALE);

    expect(config.locale).toBe(routing.defaultLocale);
  });

  it('never reads a site config when no tenant voice applies', async () => {
    await resolveConfig(LOCALE_ISO_CODES.EN);

    expect(getSiteConfig).not.toHaveBeenCalled();
  });

  describe('with a tenant voice', () => {
    beforeEach(() => {
      vi.mocked(peekVoiceTenant).mockResolvedValue(MOCK_TENANT_ID);
    });

    it.each(VOICE_FIELDS.map((field) => [field.id, field.path]))(
      'serves the %s override to server-rendered translations',
      async (id, path) => {
        const { messages } = await resolveConfig(LOCALE_ISO_CODES.EN);

        expect(translateAt(messages, path)).toBe(MOCK_OVERRIDES[id]);
      },
    );

    it('serves the catalog default for a key with no override', async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        okResult({ voiceOverridesByLocale: {} }) as never,
      );

      const { messages } = await resolveConfig(LOCALE_ISO_CODES.EN);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe(
        SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
      );
    });

    it("serves another language's own overrides over the default's", async () => {
      vi.mocked(getSiteConfig).mockResolvedValue(
        okResult({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.EN]: {
              [NOT_FOUND_HEADING_FIELD_ID]: MOCK_ENGLISH_HEADING,
            },
            [LOCALE_ISO_CODES.DE]: {
              [NOT_FOUND_HEADING_FIELD_ID]: MOCK_GERMAN_HEADING,
            },
          },
        }) as never,
      );

      const { messages } = await resolveConfig(LOCALE_ISO_CODES.DE);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe(
        MOCK_GERMAN_HEADING,
      );
    });

    it('serves the catalog default when only another language has overrides', async () => {
      const { messages } = await resolveConfig(LOCALE_ISO_CODES.DE);

      expect(translateAt(messages, NOT_FOUND_HEADING_KEY)).toBe(
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
    });
  });
});
