export type TSidebarNavLink = {
  label: string;
  href: string;
};

export type TSidebarNavItem = TSidebarNavLink & {
  level: 1 | 2;
  subItems?: TSidebarNavLink[];
};

export type TSidebarNavBackLink = TSidebarNavLink & {
  ariaLabel: string;
};

export type TSidebarNavAriaCurrent = 'location' | 'page';
