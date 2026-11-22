export type TEmailTag = {
  name: string;
  value: string;
};

export const SITE_EMAIL_TAG_NAME = 'site';
export const PLATFORM_EMAIL_TAG_NAME = 'platform';
export const OWNER_NOTICE_EMAIL_TAG_NAME = 'owner_notice';
const MARKER_EMAIL_TAG_VALUE = 'true';

export function buildSiteEmailTag(siteId: string): TEmailTag {
  return { name: SITE_EMAIL_TAG_NAME, value: siteId };
}

export function buildPlatformEmailTag(): TEmailTag {
  return { name: PLATFORM_EMAIL_TAG_NAME, value: MARKER_EMAIL_TAG_VALUE };
}

export function buildOwnerNoticeEmailTag(): TEmailTag {
  return { name: OWNER_NOTICE_EMAIL_TAG_NAME, value: MARKER_EMAIL_TAG_VALUE };
}
