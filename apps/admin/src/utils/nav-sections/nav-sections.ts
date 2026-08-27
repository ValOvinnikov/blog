import type { TSidebarNavSection } from '@admin/components/features/layout/sidebar';
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
        href: adminRoutes.addTenant(),
      },
    ],
  },
];

type TTenantNavHrefs = { look: string; voice: string; features: string };

/** The eight tenant-facing destinations, shared by the `/tenants/{id}` and slug-free `/dashboard` sidebars — only the Look/Voice/Features hrefs (and, via the caller, the section label) differ between them. Danger zone is deliberately excluded: it's platform-only and never appears in the owner-facing `/dashboard` tree. */
const tenantFacingNavItems = (t: TNavTranslator, hrefs: TTenantNavHrefs) => {
  const shipping = { label: t('badgeThisMilestone'), tone: 'neutral' } as const;
  const later = { label: t('badgeLater'), tone: 'warn' } as const;

  return [
    {
      label: t('look'),
      icon: ICONS.PALETTE,
      href: hrefs.look,
      badge: shipping,
    },
    {
      label: t('voice'),
      icon: ICONS.QUOTE,
      href: hrefs.voice,
      badge: shipping,
    },
    {
      label: t('features'),
      icon: ICONS.SETTINGS,
      href: hrefs.features,
      badge: shipping,
    },
    { label: t('domain'), icon: ICONS.GLOBE, badge: later },
    { label: t('email'), icon: ICONS.MAIL, badge: later },
    { label: t('subscribers'), icon: ICONS.MENU_ROWS, badge: later },
    { label: t('comments'), icon: ICONS.COMMENT, badge: later },
    { label: t('team'), icon: ICONS.USERS, badge: later },
  ];
};

export const tenantNavSections = (
  t: TNavTranslator,
  tenantId: string,
  tenantName: string,
): TSidebarNavSection[] => {
  const platform = {
    label: t('badgePlatform'),
    tone: 'neutral',
    hasDot: false,
  } as const;

  return [
    {
      label: t('tenantLabel', { tenantName }),
      items: [
        {
          label: t('overview'),
          icon: ICONS.HOUSE,
          href: adminRoutes.tenantOverview(tenantId),
        },
        ...tenantFacingNavItems(t, {
          look: adminRoutes.look(tenantId),
          voice: adminRoutes.voice(tenantId),
          features: adminRoutes.features(tenantId),
        }),
      ],
    },
    {
      label: t('platformSectionLabel'),
      items: [
        {
          label: t('provisioning'),
          icon: ICONS.CHECK_SHEET,
          href: adminRoutes.tenantProvisioning(tenantId),
          badge: platform,
        },
        {
          label: t('dangerZone'),
          icon: ICONS.WARNING,
          href: adminRoutes.tenantDanger(tenantId),
          badge: platform,
        },
      ],
    },
  ];
};

/** The slug-free counterpart to `tenantNavSections`'s tenant-facing section — same eight destinations, routed under `/dashboard` instead of `/tenants/{id}`, labeled generically since the whole point of this tree is not naming the tenant in anything the URL-shy owner sees. Owners never get the Overview item (there's nothing at slug-free `/dashboard` distinct from the section itself) or the platform-only Provisioning/Danger zone section. */
export const dashboardNavSections = (
  t: TNavTranslator,
): TSidebarNavSection[] => [
  {
    label: t('dashboardLabel'),
    items: tenantFacingNavItems(t, {
      look: adminRoutes.dashboardLook(),
      voice: adminRoutes.dashboardVoice(),
      features: adminRoutes.dashboardFeatures(),
    }),
  },
];
