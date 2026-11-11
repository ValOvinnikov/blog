export type TEmailTag = {
  name: string;
  value: string;
};

export const SITE_EMAIL_TAG_NAME = 'site';

export function buildSiteEmailTag(siteId: string): TEmailTag {
  return { name: SITE_EMAIL_TAG_NAME, value: siteId };
}
