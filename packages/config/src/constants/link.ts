export const LINK_TYPE = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
} as const;

export type TLinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];

export const SOCIAL_PLATFORMS = {
  X: 'X',
  GITHUB: 'GITHUB',
  LINKEDIN: 'LINKEDIN',
  YOUTUBE: 'YOUTUBE',
  INSTAGRAM: 'INSTAGRAM',
  MASTODON: 'MASTODON',
  BLUESKY: 'BLUESKY',
  FACEBOOK: 'FACEBOOK',
  THREADS: 'THREADS',
  RSS: 'RSS',
} as const;

export type TSocialPlatform =
  (typeof SOCIAL_PLATFORMS)[keyof typeof SOCIAL_PLATFORMS];
