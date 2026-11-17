export type TEmailTag = {
  name: string;
  value: string;
};

export const SITE_EMAIL_TAG_NAME = 'site';
const PLATFORM_EMAIL_TAG_NAME = 'platform';
const PLATFORM_EMAIL_TAG_VALUE = 'true';

export function buildSiteEmailTag(siteId: string): TEmailTag {
  return { name: SITE_EMAIL_TAG_NAME, value: siteId };
}

export function buildPlatformEmailTag(): TEmailTag {
  return { name: PLATFORM_EMAIL_TAG_NAME, value: PLATFORM_EMAIL_TAG_VALUE };
}
