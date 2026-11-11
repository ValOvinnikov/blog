import { ICONS, type TMaybeUndefined } from '@blog/config';
import type { TAdminRole } from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import type {
  TSidebarNavItem,
  TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import type {
  TPlanPage,
  TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';
import { studioNavItem } from '@platform/utils/studio-nav-item/studio-nav-item';

import { isCurrentNavHref } from './is-current-nav-href';

export const operatorNavSections = (
  t: TLooseTranslator,
  role: TAdminRole,
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
        label: t('findings'),
        icon: ICONS.WARNING,
        href: adminRoutes.findings(),
      },
      ...(isSuperAdmin({ role })
        ? [
            {
              label: t('releases'),
              icon: ICONS.CHECK_SHEET,
              href: adminRoutes.releases(),
            },
            {
              label: t('blockedSignups'),
              icon: ICONS.SHIELD_CHECK,
              href: adminRoutes.blockedSignups(),
            },
            {
              label: t('dataRequests'),
              icon: ICONS.LOCK,
              href: adminRoutes.dataRequests(),
            },
          ]
        : []),
    ],
  },
];

export type TTenantNavHrefs = {
  look: string;
  voice: string;
  features: string;
  leads?: string;
  languages: string;
  domain: string;
  signIn: string;
  email: string;
  studio: string;
};

export const configurationNavItems = (
  t: TLooseTranslator,
  hrefs: TTenantNavHrefs,
  access: TPlanPageAccess,
  unreadLeadsCount: number,
): TSidebarNavItem[] => {
  const comingSoon = {
    label: t('badgeComingSoon'),
    tone: BADGE_TONE.NEUTRAL,
    hasDot: false,
  } as const;
  const unreadLeads =
    unreadLeadsCount > 0
      ? ({
          label: t('badgeUnreadLeads', { count: unreadLeadsCount }),
          tone: BADGE_TONE.BRAND,
          hasDot: false,
        } as const)
      : undefined;
  const ifAccessible = (page: TPlanPage, item: TSidebarNavItem) =>
    access[page] ? [item] : [];

  return [
    { label: t('look'), icon: ICONS.PALETTE, href: hrefs.look },
    { label: t('voice'), icon: ICONS.QUOTE, href: hrefs.voice },
    { label: t('features'), icon: ICONS.SETTINGS, href: hrefs.features },
    ...(hrefs.leads
      ? ifAccessible('leads', {
          label: t('leads'),
          icon: ICONS.SEND,
          href: hrefs.leads,
          badge: unreadLeads,
        })
      : []),
    ...ifAccessible('languages', {
      label: t('languages'),
      icon: ICONS.BOOK,
      href: hrefs.languages,
    }),
    { label: t('domain'), icon: ICONS.GLOBE, href: hrefs.domain },
    { label: t('signIn'), icon: ICONS.USER_CHECK, href: hrefs.signIn },
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
  leads: true,
  subscribers: true,
  team: true,
};

export const tenantNavSections = (
  t: TLooseTranslator,
  tenantId: string,
  tenantName: string,
  unreadLeadsCount = 0,
): TSidebarNavSection[] => {
  const platform = {
    label: t('badgePlatform'),
    tone: BADGE_TONE.NEUTRAL,
    hasDot: false,
  } as const;
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.look(tenantId),
    voice: adminRoutes.voice(tenantId),
    features: adminRoutes.features(tenantId),
    leads: adminRoutes.leads(tenantId),
    languages: adminRoutes.languages(tenantId),
    domain: adminRoutes.tenantDomain(tenantId),
    signIn: adminRoutes.tenantSignIn(tenantId),
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
      items: configurationNavItems(t, hrefs, EVERY_PLAN_PAGE, unreadLeadsCount),
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

export const navLabelForPathname = (
  sections: TSidebarNavSection[],
  pathname: string,
): TMaybeUndefined<string> =>
  sections
    .flatMap((section) => section.items)
    .find(
      (item) =>
        !isUndefined(item.href) && isCurrentNavHref(item.href, pathname),
    )?.label;
