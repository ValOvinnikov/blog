import { ICONS } from '@blog/config';
import type {
  TSidebarNavItem,
  TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import type {
  TPlanPage,
  TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes, STUDIO_SEGMENT } from '@platform/utils/routes/routes';

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
  languages: string;
  domain: string;
  email: string;
  studio: string;
};

const configurationNavItems = (
  t: TNavTranslator,
  hrefs: TTenantNavHrefs,
  access: TPlanPageAccess,
): TSidebarNavItem[] => {
  const comingSoon = { label: t('badgeComingSoon'), tone: 'neutral' } as const;
  const ifAccessible = (page: TPlanPage, item: TSidebarNavItem) =>
    access[page] ? [item] : [];

  return [
    { label: t('look'), icon: ICONS.PALETTE, href: hrefs.look },
    { label: t('voice'), icon: ICONS.QUOTE, href: hrefs.voice },
    { label: t('features'), icon: ICONS.SETTINGS, href: hrefs.features },
    ...ifAccessible('languages', {
      label: t('languages'),
      icon: ICONS.BOOK,
      href: hrefs.languages,
    }),
    { label: t('domain'), icon: ICONS.GLOBE, href: hrefs.domain },
    ...ifAccessible('email', {
      label: t('email'),
      icon: ICONS.MAIL,
      href: hrefs.email,
    }),
    ...ifAccessible('subscribers', {
      label: t('subscribers'),
      icon: ICONS.MENU_ROWS,
      badge: comingSoon,
    }),
    ...ifAccessible('comments', {
      label: t('comments'),
      icon: ICONS.COMMENT,
      badge: comingSoon,
    }),
    ...ifAccessible('team', {
      label: t('team'),
      icon: ICONS.USERS,
      badge: comingSoon,
    }),
  ];
};

export const EVERY_PLAN_PAGE: TPlanPageAccess = {
  languages: true,
  email: true,
  subscribers: true,
  comments: true,
  team: true,
};

const studioNavItem = (t: TNavTranslator, href: string) => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
});

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
    languages: adminRoutes.languages(tenantId),
    domain: adminRoutes.tenantDomain(tenantId),
    email: adminRoutes.email(tenantId),
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
      items: configurationNavItems(t, hrefs, EVERY_PLAN_PAGE),
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

export const dashboardNavSections = (
  t: TNavTranslator,
  access: TPlanPageAccess,
): TSidebarNavSection[] => {
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.dashboardLook(),
    voice: adminRoutes.dashboardVoice(),
    features: adminRoutes.dashboardFeatures(),
    languages: adminRoutes.dashboardLanguages(),
    domain: adminRoutes.dashboardDomain(),
    email: adminRoutes.dashboardEmail(),
    studio: adminRoutes.dashboardStudio(),
  };

  return [
    {
      label: t('yourSiteLabel'),
      items: [
        {
          label: t('overview'),
          icon: ICONS.HOUSE,
          href: adminRoutes.dashboard(),
        },
      ],
    },
    {
      label: t('contentSectionLabel'),
      items: [studioNavItem(t, hrefs.studio)],
    },
    {
      label: t('configurationSectionLabel'),
      items: configurationNavItems(t, hrefs, access),
    },
  ];
};

const isNavItemFor = (href: string, pathname: string) =>
  pathname === href ||
  (href.endsWith(`/${STUDIO_SEGMENT}`) && pathname.startsWith(`${href}/`));

export const navLabelForPathname = (
  sections: TSidebarNavSection[],
  pathname: string,
): string | undefined =>
  sections
    .flatMap((section) => section.items)
    .find(
      (item) => item.href !== undefined && isNavItemFor(item.href, pathname),
    )?.label;
