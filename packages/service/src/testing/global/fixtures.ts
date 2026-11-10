import type { TRawFooter } from '@blog/service/features/global/footer/adaptor/transformer';
import type { TRawNavigation } from '@blog/service/features/global/navigation/adaptor/transformer';
import type { TRawSiteSettings } from '@blog/service/features/global/site-settings/adaptor/transformer';

export function mockRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    currency: 'USD',
    pricePeriodSuffix: null,
    ...overrides,
  };
}

export function mockRawNavigation(
  overrides: Partial<TRawNavigation> = {},
): TRawNavigation {
  return {
    items: null,
    tagline: null,
    showLanguageSwitcher: null,
    ...overrides,
  };
}

export function mockRawFooter(overrides: Partial<TRawFooter> = {}): TRawFooter {
  return {
    social: null,
    groups: null,
    about: null,
    address: null,
    copyrightName: null,
    finePrint: null,
    showLanguageSwitcher: null,
    showRssFeed: null,
    ...overrides,
  };
}
