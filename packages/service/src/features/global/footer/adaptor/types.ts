import type { ILink, TSocialPlatform } from '@blog/config';

export type TFooterSocialLink = {
  platform: TSocialPlatform;
  link: ILink;
};

export type TFooter = {
  social: TFooterSocialLink[];
};
