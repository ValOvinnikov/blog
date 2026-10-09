import type { TSidebarNavItem } from '@web/components/shared/sidebar-nav';

export const mockSidebarNavItems: TSidebarNavItem[] = [
  { label: 'Modules', href: '/modules', level: 1 },
  { label: 'FAQ', href: '/modules/faq', level: 2 },
  { label: 'Pricing', href: '/modules/pricing', level: 2 },
  { label: 'Support', href: '/modules/support', level: 2 },
];

export const mockSidebarNavNestedItems: TSidebarNavItem[] = [
  { label: 'Blog hero layouts', href: '/modules/blog-hero', level: 1 },
  { label: 'Split left', href: '/modules/blog-hero/split-left', level: 2 },
  { label: 'Split right', href: '/modules/blog-hero/split-right', level: 2 },
  { label: 'Centred', href: '/modules/blog-hero/centred', level: 2 },
];

export const mockSidebarNavBackLink = {
  label: 'Modules',
  href: '/modules',
  ariaLabel: 'Back to Modules',
};

export const mockSidebarNavContentsItems: TSidebarNavItem[] = [
  { label: 'Getting started', href: '#getting-started', level: 1 },
  { label: 'Prerequisites', href: '#prerequisites', level: 2 },
  { label: 'Configuration', href: '#configuration', level: 1 },
  { label: 'Deployment', href: '#deployment', level: 1 },
];
