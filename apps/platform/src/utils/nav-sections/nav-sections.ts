import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import {
  configurationNavItems,
  type TTenantNavHrefs,
} from '@platform/utils/configuration-nav-items/configuration-nav-items';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import {
  EVERY_PLAN_PAGE,
  type TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';
import { studioNavItem } from '@platform/utils/studio-nav-item/studio-nav-item';
import { superAdminNavItems } from '@platform/utils/super-admin-nav-items/super-admin-nav-items';
import { teamNavItem } from '@platform/utils/team-nav-item/team-nav-item';
import { ICONS, type TMaybeUndefined } from '@shinefold/config';
import type { TAdminRole } from '@shinefold/db/constants';
import { isUndefined } from '@shinefold/utils/primitives';

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
      ...(isSuperAdmin({ role }) ? superAdminNavItems(t) : []),
    ],
  },
];

export const tenantNavSections = (
  t: TLooseTranslator,
  tenantId: string,
  tenantName: string,
  { subscribers }: Pick<TPlanPageAccess, 'subscribers'>,
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
    subscribers: adminRoutes.tenantSubscribers(tenantId),
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
      items: configurationNavItems(t, hrefs, {
        ...EVERY_PLAN_PAGE,
        subscribers,
      }),
    },
    {
      label: t('accountSectionLabel'),
      items: [teamNavItem(t, adminRoutes.tenantTeam(tenantId))],
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
