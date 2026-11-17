export const PRICING_LOG = {
  MODULE_FETCH_FAILED: 'pricing_module.fetch_failed',
  SITE_SETTINGS_FAILED: 'pricing_module.site_settings_failed',
  PLAN_PRICES_FETCH_FAILED: 'pricing_module.plan_prices_fetch_failed',
  PROMOTION_CODE_LOOKUP_FAILED: 'pricing_module.promotion_code_lookup_failed',
  PROMOTION_CODE_FETCH_FAILED: 'pricing_module.promotion_code_fetch_failed',
  VISITOR_CURRENCY_FETCH_FAILED: 'pricing_module.visitor_currency_fetch_failed',
} as const;

export const PRICING_SEARCH_PARAM = {
  PROMO: 'promo',
} as const;

export const PLAN_COMPARISON_ROW = {
  LANGUAGES: 'LANGUAGES',
  SEATS: 'SEATS',
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN',
  NO_POWERED_BY_MARK: 'NO_POWERED_BY_MARK',
  LOOK_SETTINGS: 'LOOK_SETTINGS',
  SECTION_TYPES: 'SECTION_TYPES',
  OWN_ANALYTICS: 'OWN_ANALYTICS',
  OWN_SIGN_IN_APPS: 'OWN_SIGN_IN_APPS',
  CONTACT_FORM: 'CONTACT_FORM',
  READER_ACCOUNTS: 'READER_ACCOUNTS',
  NEWSLETTER_SUBSCRIBERS: 'NEWSLETTER_SUBSCRIBERS',
  TAKEAWAYS_PER_MONTH: 'TAKEAWAYS_PER_MONTH',
} as const;
