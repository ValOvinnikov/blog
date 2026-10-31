import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import {
  ALWAYS_AVAILABLE_KEYS,
  COMING_SOON_KEYS,
  CONFIGURATION_KEYS,
  itemKeyed,
  labelsOf,
  MOCK_UNREAD_LEADS_COUNT,
  NO_PLAN_PAGE,
  tNavSections as t,
  translated,
} from '@platform/testing/layout/nav-sections';
import { EVERY_PLAN_PAGE } from '@platform/utils/nav-sections/nav-sections';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';

import { dashboardNavSections } from './dashboard-nav-sections';

const configurationOfDashboard = (access: TPlanPageAccess = EVERY_PLAN_PAGE) =>
  dashboardNavSections(t, access)[2]!;

describe(dashboardNavSections, () => {
  it("badges the Studio link with the owner's access state", () => {
    const [, content] = dashboardNavSections(t, EVERY_PLAN_PAGE, {
      access: OWNER_STUDIO_ACCESS.STALLED,
      hasEntered: false,
    });

    expect(content!.items[0]?.badge?.label).toBe(
      t(`studioAccess.${OWNER_STUDIO_ACCESS.STALLED}`),
    );
  });

  it('opens with a Dashboard section holding only Overview', () => {
    const [dashboard] = dashboardNavSections(t, EVERY_PLAN_PAGE);
    const [overview, ...rest] = dashboard!.items;

    expect(dashboard!.label).toBe(t('dashboardLabel'));
    expect(overview?.label).toBe(t('overview'));
    expect(overview?.href).toBe(adminRoutes.dashboard());
    expect(rest).toEqual([]);
  });

  it('links Studio in the Content section', () => {
    const [, content] = dashboardNavSections(t, EVERY_PLAN_PAGE);
    const [studio, ...rest] = content!.items;

    expect(studio?.label).toBe(t('studio'));
    expect(studio?.href).toBe(adminRoutes.dashboardStudio());
    expect(rest).toEqual([]);
  });

  it('lists every Configuration page when the plan can use them all', () => {
    expect(labelsOf(configurationOfDashboard())).toEqual(
      translated(CONFIGURATION_KEYS),
    );
  });

  it('keeps only the always-available pages when the plan gates the rest', () => {
    expect(labelsOf(configurationOfDashboard(NO_PLAN_PAGE))).toEqual(
      translated(ALWAYS_AVAILABLE_KEYS),
    );
  });

  it.each([
    'languages',
    'email',
    'leads',
    'subscribers',
    'comments',
    'team',
  ] as const)('shows %s only when the plan can use it', (page) => {
    const withPage = configurationOfDashboard({
      ...NO_PLAN_PAGE,
      [page]: true,
    });
    const withoutPage = configurationOfDashboard({
      ...EVERY_PLAN_PAGE,
      [page]: false,
    });

    expect(labelsOf(withPage)).toContain(t(page));
    expect(labelsOf(withoutPage)).not.toContain(t(page));
  });

  it('badges only Subscribers, Comments and Team as coming soon', () => {
    const badged = configurationOfDashboard().items.filter(
      (item) => item.badge,
    );

    expect(badged.map((item) => item.label)).toEqual(
      translated(COMING_SOON_KEYS),
    );
    for (const item of badged) {
      expect(item.badge?.label).toBe(t('badgeComingSoon'));
      expect(item.href).toBeUndefined();
    }
  });

  it.each([
    ['look', adminRoutes.dashboardLook()],
    ['voice', adminRoutes.dashboardVoice()],
    ['features', adminRoutes.dashboardFeatures()],
    ['leads', adminRoutes.dashboardLeads()],
    ['languages', adminRoutes.dashboardLanguages()],
    ['domain', adminRoutes.dashboardDomain()],
    ['email', adminRoutes.dashboardEmail()],
  ])('links Configuration %s to its dashboard page', (key, href) => {
    const item = itemKeyed(configurationOfDashboard(), key);

    expect(item?.href).toBe(href);
  });

  it('badges Leads with the unread count when there are unread leads', () => {
    const [, , configuration] = dashboardNavSections(
      t,
      EVERY_PLAN_PAGE,
      undefined,
      MOCK_UNREAD_LEADS_COUNT,
    );

    const leads = itemKeyed(configuration!, 'leads');

    expect(leads?.badge?.label).toBe(
      t('badgeUnreadLeads', { count: MOCK_UNREAD_LEADS_COUNT }),
    );
  });

  it('never includes the platform-only entries or a tenant label', () => {
    const sections = dashboardNavSections(t, EVERY_PLAN_PAGE);
    const labels = [
      ...sections.map((section) => section.label),
      ...sections.flatMap(labelsOf),
    ];
    const tenantLabelPrefix = t('tenantLabel', { tenantName: '' });

    expect(labels).not.toContain(t('provisioning'));
    expect(labels).not.toContain(t('dangerZone'));
    expect(
      labels.filter((label) => label.startsWith(tenantLabelPrefix)),
    ).toEqual([]);
  });
});
