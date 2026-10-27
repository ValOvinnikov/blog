import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  SITE_MESSAGES_BY_LOCALE,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service';
import { faker } from '@faker-js/faker';
import type { TRequestContext } from '@web/server/request-context/request-context';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_OG_IMAGE } from '@web/testing/shared/seo/og-image-fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { createTranslator } from 'next-intl';

const { EN, NL } = LOCALE_ISO_CODES;

export const NL_PATH_PREFIX = `/${LOCALE_BCP47_TAGS.NL}`;

export const DE_PATH_PREFIX = `/${LOCALE_BCP47_TAGS.DE}`;

export const NOINDEX_ROBOTS = { index: false, follow: false };

export const MOCK_BILINGUAL_REQUEST_CONTEXT: TRequestContext = {
  ...MOCK_REQUEST_CONTEXT,
  liveLocales: [EN, NL],
};

export const MOCK_DUTCH_REQUEST_CONTEXT: TRequestContext = {
  ...MOCK_BILINGUAL_REQUEST_CONTEXT,
  locale: NL,
};

export const mockMetadataSeo = (
  overrides: Partial<TSeoResolved> = {},
): TSeoResolved =>
  mockSeo({
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    ogTitle: faker.lorem.words(3),
    ogDescription: faker.lorem.sentence(),
    ogImage: MOCK_OG_IMAGE,
    ...overrides,
  });

export const toPageSuffix = (page: number): string =>
  createTranslator({
    locale: EN,
    messages: SITE_MESSAGES_BY_LOCALE.EN,
    namespace: 'pagination',
  })('pageSuffix', { page });
