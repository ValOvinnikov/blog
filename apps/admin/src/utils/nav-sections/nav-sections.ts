import type { TSidebarNavSection } from '@admin/components/sidebar';
import { adminRoutes } from '@admin/utils/routes/routes';
import { ICONS } from '@blog/config';

/** Structurally compatible with both `useTranslations`'s and `getTranslations`'s return type, without fighting next-intl's per-namespace literal-key generic. */
export type TNavTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const platformNavSections = (
  t: TNavTranslator,
): TSidebarNavSection[] => [
  {
    label: t('platformLabel'),
    items: [
      {
        label: t('tenants'),
        icon: ICONS.GRID,
        href: adminRoutes.tenants(),
      },
      {
        label: t('addTenant'),
        icon: ICONS.PLUS,
        badge: { label: t('badgeDeferred'), tone: 'warn' },
        disabledReason: t('addTenantDisabledReason'),
      },
    ],
  },
];

export const tenantNavSections = (
  t: TNavTranslator,
  tenantSlug: string,
): TSidebarNavSection[] => {
  const shipping = { label: t('badgeThisMilestone'), tone: 'neutral' } as const;
  const later = { label: t('badgeLater'), tone: 'warn' } as const;

  return [
    {
      label: t('tenantLabel', { tenantSlug }),
      items: [
        {
          label: t('look'),
          icon: ICONS.PALETTE,
          href: adminRoutes.look(tenantSlug),
          badge: shipping,
        },
        {
          label: t('voice'),
          icon: ICONS.QUOTE,
          href: adminRoutes.voice(tenantSlug),
          badge: shipping,
        },
        { label: t('domain'), icon: ICONS.GLOBE, badge: later },
        { label: t('email'), icon: ICONS.MAIL, badge: later },
        { label: t('subscribers'), icon: ICONS.MENU_ROWS, badge: later },
        { label: t('comments'), icon: ICONS.COMMENT, badge: later },
        { label: t('team'), icon: ICONS.USERS, badge: later },
        { label: t('dangerZone'), icon: ICONS.WARNING, badge: later },
      ],
    },
  ];
};
