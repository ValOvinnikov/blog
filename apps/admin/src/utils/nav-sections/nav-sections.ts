import type { TSidebarNavSection } from '@admin/components/sidebar';
import { adminRoutes } from '@admin/utils/routes/routes';
import { ICONS } from '@blog/config';

const LATER = { label: 'later', tone: 'warn' } as const;

export const platformNavSections = (): TSidebarNavSection[] => [
  {
    label: 'Platform',
    items: [
      { label: 'Tenants', icon: ICONS.GRID, href: adminRoutes.tenants() },
      {
        label: 'Add tenant',
        icon: ICONS.PLUS,
        badge: { label: 'deferred', tone: 'warn' },
        disabledReason: "Provisioning a new tenant isn't available yet.",
      },
    ],
  },
];

export const tenantNavSections = (tenantSlug: string): TSidebarNavSection[] => {
  const shipping = { label: 'this milestone', tone: 'neutral' } as const;

  return [
    {
      label: `Tenant · ${tenantSlug}`,
      items: [
        {
          label: 'Look',
          icon: ICONS.PALETTE,
          href: adminRoutes.look(tenantSlug),
          badge: shipping,
        },
        {
          label: 'Voice',
          icon: ICONS.QUOTE,
          href: adminRoutes.voice(tenantSlug),
          badge: shipping,
        },
        { label: 'Domain', icon: ICONS.GLOBE, badge: LATER },
        { label: 'Email', icon: ICONS.MAIL, badge: LATER },
        { label: 'Subscribers', icon: ICONS.MENU_ROWS, badge: LATER },
        { label: 'Comments', icon: ICONS.COMMENT, badge: LATER },
        { label: 'Team', icon: ICONS.USERS, badge: LATER },
        { label: 'Danger zone', icon: ICONS.WARNING, badge: LATER },
      ],
    },
  ];
};
