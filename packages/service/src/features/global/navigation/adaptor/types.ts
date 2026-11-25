import type { ILink, TMaybeUndefined } from '@shinefold/config';

export type TNavigationItem = ILink & {
  subItems?: ILink[];
};

export type TNavigation = {
  items: TNavigationItem[];
  headerAction: TMaybeUndefined<ILink>;
  tagline: TMaybeUndefined<string>;
  showLanguageSwitcher?: boolean;
};
