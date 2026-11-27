import type {
  TSidebarNavItem,
  TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import { billingNavItem } from '@platform/utils/billing-nav-item/billing-nav-item';
import {
  configurationNavItems,
  type TTenantNavHrefs,
} from '@platform/utils/configuration-nav-items/configuration-nav-items';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';
import { studioNavItem } from '@platform/utils/studio-nav-item/studio-nav-item';
import { teamNavItem } from '@platform/utils/team-nav-item/team-nav-item';
import { ICONS } from '@shinefold/config';
import type { TStudioAccess } from '@shinefold/config/constants';
import { hasLength } from '@shinefold/utils/primitives';

export const dashboardNavSections = (
  t: TLooseTranslator,
  access: TPlanPageAccess,
  studioAccess?: TStudioAccess,
): TSidebarNavSection[] => {
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.dashboardLook(),
    voice: adminRoutes.dashboardVoice(),
    features: adminRoutes.dashboardFeatures(),
    leads: adminRoutes.dashboardLeads(),
    languages: adminRoutes.dashboardLanguages(),
    domain: adminRoutes.dashboardDomain(),
    signIn: adminRoutes.dashboardSignIn(),
    email: adminRoutes.dashboardEmail(),
    studio: adminRoutes.dashboardStudio(),
    subscribers: adminRoutes.dashboardSubscribers(),
  };

  const accountItems: TSidebarNavItem[] = [
    ...(access.team ? [teamNavItem(t, adminRoutes.dashboardTeam())] : []),
    ...(access.billing
      ? [billingNavItem(t, adminRoutes.dashboardBilling())]
      : []),
  ];

  return [
    {
      label: t('dashboardLabel'),
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
      items: [studioNavItem(t, hrefs.studio, studioAccess)],
    },
    {
      label: t('configurationSectionLabel'),
      items: configurationNavItems(t, hrefs, access),
    },
    ...(hasLength(accountItems)
      ? [{ label: t('accountSectionLabel'), items: accountItems }]
      : []),
  ];
};
