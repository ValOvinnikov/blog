import type {
  FOOTER_FINE_PRINT_KIND,
  ILink,
  TMaybeUndefined,
} from '@blog/config';
import type { TSocialProfile } from '@blog/service/shared/transformers/social-profile/to-social-profile';

export type TFooterLinkGroup = {
  heading: TMaybeUndefined<string>;
  links: ILink[];
};

export type TFooterFinePrintItem =
  | { kind: typeof FOOTER_FINE_PRINT_KIND.LINK; link: ILink }
  | { kind: typeof FOOTER_FINE_PRINT_KIND.COOKIE_SETTINGS };

export type TFooter = {
  social: TSocialProfile[];
  groups: TFooterLinkGroup[];
  about: TMaybeUndefined<string>;
  address: TMaybeUndefined<string>;
  finePrint: TFooterFinePrintItem[];
  showLanguageSwitcher?: boolean;
  showRssFeed: boolean;
};
