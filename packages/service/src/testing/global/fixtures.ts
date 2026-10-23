import type { TRawFooter } from '@blog/service/features/global/footer/adaptor/transformer';
import type { TRawNavigation } from '@blog/service/features/global/navigation/adaptor/transformer';
import type { TRawSiteSettings } from '@blog/service/features/global/site-settings/adaptor/transformer';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockRawSanityImage } from '@blog/service/testing/shared/fixtures';

export const MOCK_LINKED_PAGE_CACHE_TAGS = [
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
];

export function mockRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    brand: {
      name: 'My Blog',
      tagline: null,
      logo: mockRawSanityImage('Logo'),
    },
    currency: 'USD',
    ...overrides,
  };
}

export function mockRawNavigation(
  overrides: Partial<TRawNavigation> = {},
): TRawNavigation {
  return {
    items: null,
    showLanguageSwitcher: null,
    ...overrides,
  };
}

export function mockRawFooter(overrides: Partial<TRawFooter> = {}): TRawFooter {
  return {
    social: null,
    showLanguageSwitcher: null,
    showRssFeed: null,
    ...overrides,
  };
}
