import type { ILink, TMaybeUndefined } from '@shinefold/config';

export type TNavigationItem = ILink & {
  subItems?: ILink[];
};

export type TNavigation = {
  items: TNavigationItem[];
  tagline: TMaybeUndefined<string>;
  showLanguageSwitcher?: boolean;
};
