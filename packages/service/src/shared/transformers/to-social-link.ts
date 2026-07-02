export type TSocialLink = {
  platform: string;
  url: string;
};

export function toSocialLink(raw: TSocialLink): TSocialLink {
  return {
    platform: raw.platform,
    url: raw.url,
  };
}
