import { ICONS, type TIconName } from '@blog/config';

// The CMS `socialLink.platform` field is free-text (see
// `packages/studio/src/schema-types/objects/social-link.ts`), not a constrained
// enum — so this maps by matching known platform names case-insensitively
// rather than a direct lookup against `ICONS`.
const SOCIAL_ICON_NAME_BY_PLATFORM: Record<string, TIconName> = {
  x: ICONS.X,
  twitter: ICONS.X,
  github: ICONS.GITHUB,
  linkedin: ICONS.LINKEDIN,
  facebook: ICONS.FACEBOOK,
  rss: ICONS.RSS,
};

/**
 * toSocialIconName — resolves a `socialLink.platform` string (author-entered
 * free text, e.g. "X", "GitHub", "Twitter") to the matching `Icon` name for
 * the author page's social links. Returns `undefined` for a platform outside
 * the current 5-mark set, so `ShareLink` falls back to its label-only
 * rendering rather than showing no icon slot at all.
 *
 * @example
 * toSocialIconName('GitHub') // ICONS.GITHUB
 * toSocialIconName('Mastodon') // undefined
 */
export const toSocialIconName = (platform: string): TIconName | undefined => {
  return SOCIAL_ICON_NAME_BY_PLATFORM[platform.trim().toLowerCase()];
};
