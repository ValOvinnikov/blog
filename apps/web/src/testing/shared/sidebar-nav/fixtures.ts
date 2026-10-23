import { SITE_MESSAGES } from '@blog/config';
import type { TSidebarNavItem } from '@web/components/shared/sidebar-nav';

export const MOCK_SIDEBAR_NAV_LABEL = SITE_MESSAGES.sectionNavigation.label;

export const MOCK_SIDEBAR_NAV_PRICING_ITEM: TSidebarNavItem = {
  label: 'Pricing',
  href: '/modules/pricing',
  level: 2,
};

export const MOCK_SIDEBAR_NAV_TRIGGER_NAME = `${MOCK_SIDEBAR_NAV_LABEL} ${MOCK_SIDEBAR_NAV_PRICING_ITEM.label}`;

export const MOCK_SIDEBAR_NAV_ITEMS: TSidebarNavItem[] = [
  { label: 'Modules', href: '/modules', level: 1 },
  { label: 'FAQ', href: '/modules/faq', level: 2 },
  MOCK_SIDEBAR_NAV_PRICING_ITEM,
  { label: 'Support', href: '/modules/support', level: 2 },
];

export const MOCK_SIDEBAR_NAV_NESTED_ITEMS: TSidebarNavItem[] = [
  { label: 'Blog hero layouts', href: '/modules/blog-hero', level: 1 },
  { label: 'Split left', href: '/modules/blog-hero/split-left', level: 2 },
  { label: 'Split right', href: '/modules/blog-hero/split-right', level: 2 },
  { label: 'Centred', href: '/modules/blog-hero/centred', level: 2 },
];

export const MOCK_SIDEBAR_NAV_BACK_LINK = {
  label: 'Modules',
  href: '/modules',
  ariaLabel: 'Back to Modules',
};

export const MOCK_SIDEBAR_NAV_CONTENTS_ITEMS: TSidebarNavItem[] = [
  { label: 'Getting started', href: '#getting-started', level: 1 },
  { label: 'Prerequisites', href: '#prerequisites', level: 2 },
  { label: 'Configuration', href: '#configuration', level: 1 },
  { label: 'Deployment', href: '#deployment', level: 1 },
];
