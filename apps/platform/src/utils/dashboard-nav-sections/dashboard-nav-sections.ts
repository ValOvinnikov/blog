import { ICONS } from '@blog/config';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import {
  configurationNavItems,
  type TTenantNavHrefs,
} from '@platform/utils/nav-sections/nav-sections';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  studioNavItem,
  type TStudioNavState,
} from '@platform/utils/studio-nav-item/studio-nav-item';

export const dashboardNavSections = (
  t: TLooseTranslator,
  access: TPlanPageAccess,
  studio?: TStudioNavState,
  unreadLeadsCount = 0,
): TSidebarNavSection[] => {
  const hrefs: TTenantNavHrefs = {
    look: adminRoutes.dashboardLook(),
    voice: adminRoutes.dashboardVoice(),
    features: adminRoutes.dashboardFeatures(),
    leads: adminRoutes.dashboardLeads(),
    languages: adminRoutes.dashboardLanguages(),
    domain: adminRoutes.dashboardDomain(),
    email: adminRoutes.dashboardEmail(),
    studio: adminRoutes.dashboardStudio(),
  };

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
      items: [studioNavItem(t, hrefs.studio, studio)],
    },
    {
      label: t('configurationSectionLabel'),
      items: configurationNavItems(t, hrefs, access, unreadLeadsCount),
    },
  ];
};
