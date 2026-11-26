import { SITE_MESSAGES } from '@shinefold/config';
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

export const MOCK_SIDEBAR_NAV_GROUP_CURRENT_ITEM = {
  label: 'Install',
  href: '/guides/setup/install',
};

export const MOCK_SIDEBAR_NAV_GROUP_ITEM: TSidebarNavItem = {
  label: 'Setup',
  href: '/guides/setup',
  level: 2,
  subItems: [
    MOCK_SIDEBAR_NAV_GROUP_CURRENT_ITEM,
    { label: 'Configure', href: '/guides/setup/configure' },
  ],
};

export const MOCK_SIDEBAR_NAV_GROUPED_ITEMS: TSidebarNavItem[] = [
  { label: 'Guides', href: '/guides', level: 1 },
  MOCK_SIDEBAR_NAV_GROUP_ITEM,
  {
    label: 'Publishing',
    href: '/guides/publishing',
    level: 2,
    subItems: [
      { label: 'Drafts', href: '/guides/publishing/drafts' },
      { label: 'Releases', href: '/guides/publishing/releases' },
    ],
  },
  { label: 'Glossary', href: '/guides/glossary', level: 2 },
];
