import { ICONS } from '@blog/config';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { adminRoutes } from '@platform/utils/routes/routes';

/** Structurally compatible with both `useTranslations`'s and `getTranslations`'s return type, without fighting next-intl's per-namespace literal-key generic. */
export type TNavTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const operatorNavSections = (
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
        href: adminRoutes.newTenant(),
      },
      {
        label: t('findings'),
        icon: ICONS.WARNING,
        href: adminRoutes.findings(),
      },
    ],
  },
];

type TTenantNavHrefs = {
  look: string;
  voice: string;
  features: string;
  domain: string;
  studio: string;
};

/** The four site-configuration destinations that route somewhere today, shared by the `/tenants/{id}` and slug-free `/dashboard` sidebars — only the hrefs (and, via the caller, the section label) differ between them. */
const configurationNavItems = (t: TNavTranslator, hrefs: TTenantNavHrefs) => {
  const shipping = { label: t('badgeThisMilestone'), tone: 'neutral' } as const;

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
    {
      label: t('domain'),
      icon: ICONS.GLOBE,
      href: hrefs.domain,
      badge: shipping,
    },
  ];
};

/** Studio edits the tenant's content rather than configuring the site, so it lives in its own Content section rather than alongside Look/Voice/Features/Domain. Shared by the `/tenants/{id}` and slug-free `/dashboard` sidebars, same as `configurationNavItems`. Carries no badge — it's live and routable today, unlike the "this milestone"/"later" items around it. */
const studioNavItem = (t: TNavTranslator, href: string) => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
});

/** Tenant-facing destinations with no owner-actionable route yet — platform-only, and dropped from the owner-facing `/dashboard` tree entirely rather than shown as a permanently inert "later" badge. */
const laterPlatformNavItems = (t: TNavTranslator) => {
  const later = { label: t('badgeLater'), tone: 'warn' } as const;

  return [
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
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.look(tenantId),
    voice: adminRoutes.voice(tenantId),
    features: adminRoutes.features(tenantId),
    domain: adminRoutes.tenantDomain(tenantId),
    studio: adminRoutes.tenantStudio(tenantId),
  };

  return [
    {
      label: t('tenantLabel', { tenantName }),
      items: [
        {
          label: t('overview'),
          icon: ICONS.HOUSE,
          href: adminRoutes.tenantOverview(tenantId),
        },
      ],
    },
    {
      label: t('contentSectionLabel'),
      items: [studioNavItem(t, hrefs.studio)],
    },
    {
      label: t('configurationSectionLabel'),
      items: [...configurationNavItems(t, hrefs), ...laterPlatformNavItems(t)],
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

/** The slug-free counterpart to `tenantNavSections`'s Content/Configuration sections — same shipping destinations, routed under `/dashboard` instead of `/tenants/{id}`. Owners never get the Overview item (there's nothing at slug-free `/dashboard` distinct from the sections themselves), the platform-only Provisioning/Danger zone section, or the four not-yet-owner-actionable items (Email, Subscribers, Comments, Team) — those are dropped entirely rather than shown as a permanently inert "later" badge. */
export const dashboardNavSections = (
  t: TNavTranslator,
): TSidebarNavSection[] => {
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.dashboardLook(),
    voice: adminRoutes.dashboardVoice(),
    features: adminRoutes.dashboardFeatures(),
    domain: adminRoutes.dashboardDomain(),
    studio: adminRoutes.dashboardStudio(),
  };

  return [
    {
      label: t('contentSectionLabel'),
      items: [studioNavItem(t, hrefs.studio)],
    },
    {
      label: t('configurationSectionLabel'),
      items: configurationNavItems(t, hrefs),
    },
  ];
};
