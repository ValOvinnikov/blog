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

/** Display name for each social platform; casing (GitHub, YouTube, RSS, …) can't be derived from the enum key. */
export const SOCIAL_PLATFORM_LABEL: Record<TSocialPlatform, string> = {
  [SOCIAL_PLATFORMS.X]: 'X',
  [SOCIAL_PLATFORMS.GITHUB]: 'GitHub',
  [SOCIAL_PLATFORMS.LINKEDIN]: 'LinkedIn',
  [SOCIAL_PLATFORMS.YOUTUBE]: 'YouTube',
  [SOCIAL_PLATFORMS.INSTAGRAM]: 'Instagram',
  [SOCIAL_PLATFORMS.MASTODON]: 'Mastodon',
  [SOCIAL_PLATFORMS.BLUESKY]: 'Bluesky',
  [SOCIAL_PLATFORMS.FACEBOOK]: 'Facebook',
  [SOCIAL_PLATFORMS.THREADS]: 'Threads',
  [SOCIAL_PLATFORMS.RSS]: 'RSS',
};
