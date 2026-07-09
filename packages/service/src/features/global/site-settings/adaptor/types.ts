import type { TSocialLink } from '#/shared/transformers/to-social-link';

export type TNavItem = {
  label: string;
  href: string;
};

export type TSiteSettings = {
  title: string;
  description: string;
  tagline: string | undefined;
  brandPrefix: string;
  brandSuffix: string | undefined;
  logoUrl: string | undefined;
  ogImageUrl: string | undefined;
  ogTitle: string | undefined;
  ogDescription: string | undefined;
  navigation: TNavItem[];
  socialLinks: TSocialLink[];
};
