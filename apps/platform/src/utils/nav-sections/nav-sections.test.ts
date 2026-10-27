import { ADMIN_ROLE } from '@blog/db/constants';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { ICON_REGISTRY } from '@platform/components/shared/icon/icon-registry';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes, STUDIO_SEGMENT } from '@platform/utils/routes/routes';

import {
  dashboardNavSections,
  EVERY_PLAN_PAGE,
  navLabelForPathname,
  operatorNavSections,
  tenantNavSections,
} from './nav-sections';

const t = makeEnTranslator('navSections');

const NO_PLAN_PAGE: TPlanPageAccess = {
  languages: false,
  email: false,
  leads: false,
  subscribers: false,
  comments: false,
  team: false,
};

const CONFIGURATION_KEYS = [
  'look',
  'voice',
  'features',
  'leads',
  'languages',
  'domain',
  'email',
  'subscribers',
  'comments',
  'team',
];
const COMING_SOON_KEYS = ['subscribers', 'comments', 'team'];
const ALWAYS_AVAILABLE_KEYS = ['look', 'voice', 'features', 'domain'];
const SUPERADMIN_ONLY_KEYS = ['releases', 'blockedSignups', 'dataRequests'];
const MOCK_UNREAD_LEADS_COUNT = 3;

const translated = (keys: string[]) => keys.map((key) => t(key));
const labelsOf = (section: TSidebarNavSection) =>
  section.items.map((item) => item.label);
const itemKeyed = (section: TSidebarNavSection, key: string) =>
  section.items.find((item) => item.label === t(key));
const configurationOfDashboard = (access: TPlanPageAccess = EVERY_PLAN_PAGE) =>
  dashboardNavSections(t, access)[2]!;

describe(operatorNavSections, () => {
  it.each([
    ['tenants', adminRoutes.tenants()],
    ['addTenant', adminRoutes.newTenant()],
    ['findings', adminRoutes.findings()],
  ])('links %s to its page for every admin', (key, href) => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.ADMIN);

    const item = itemKeyed(platform!, key);

    expect(item?.href).toBe(href);
  });

  it.each([
    ['releases', adminRoutes.releases()],
    ['blockedSignups', adminRoutes.blockedSignups()],
    ['dataRequests', adminRoutes.dataRequests()],
  ])('links %s to its page for a SUPERADMIN', (key, href) => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.SUPERADMIN);

    const item = itemKeyed(platform!, key);

    expect(item?.href).toBe(href);
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'omits the SUPERADMIN-only entries for a %s',
    (role) => {
      const [platform] = operatorNavSections(t, role);

      const labels = labelsOf(platform!);

      for (const key of SUPERADMIN_ONLY_KEYS) {
        expect(labels).not.toContain(t(key));
      }
    },
  );
});

describe(tenantNavSections, () => {
  let tenant: TSidebarNavSection;
  let content: TSidebarNavSection;
  let configuration: TSidebarNavSection;
  let platform: TSidebarNavSection;

  beforeEach(() => {
    const sections = tenantNavSections(t, MOCK_TENANT_ID, MOCK_TENANT_NAME);
    tenant = sections[0]!;
    content = sections[1]!;
    configuration = sections[2]!;
    platform = sections[3]!;
  });

  it("labels the main section with the tenant's name, not its id", () => {
    expect(tenant.label).toBe(
      t('tenantLabel', { tenantName: MOCK_TENANT_NAME }),
    );
    expect(tenant.label).not.toContain(MOCK_TENANT_ID);
  });

  it('gives the four sections distinct labels', () => {
    const labels = [tenant, content, configuration, platform].map(
      (section) => section.label,
    );

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('puts only Overview in the main section, linked to the tenant', () => {
    const [overview, ...rest] = tenant.items;

    expect(overview?.label).toBe(t('overview'));
    expect(overview?.href).toBe(adminRoutes.tenantOverview(MOCK_TENANT_ID));
    expect(rest).toEqual([]);
  });

  it('puts only Studio in the Content section, linked to the tenant', () => {
    const [studio, ...rest] = content.items;

    expect(studio?.label).toBe(t('studio'));
    expect(studio?.href).toBe(adminRoutes.tenantStudio(MOCK_TENANT_ID));
    expect(rest).toEqual([]);
  });

  it('lists every Configuration destination, Look through Team', () => {
    expect(labelsOf(configuration)).toEqual(translated(CONFIGURATION_KEYS));
  });

  it.each([
    ['look', adminRoutes.look(MOCK_TENANT_ID)],
    ['voice', adminRoutes.voice(MOCK_TENANT_ID)],
    ['features', adminRoutes.features(MOCK_TENANT_ID)],
    ['leads', adminRoutes.leads(MOCK_TENANT_ID)],
    ['languages', adminRoutes.languages(MOCK_TENANT_ID)],
    ['domain', adminRoutes.tenantDomain(MOCK_TENANT_ID)],
    ['email', adminRoutes.email(MOCK_TENANT_ID)],
  ])('links Configuration %s to the tenant page', (key, href) => {
    const item = itemKeyed(configuration, key);

    expect(item?.href).toBe(href);
  });

  it('marks only Subscribers, Comments and Team as unlinked coming soon', () => {
    const badged = configuration.items.filter((item) => item.badge);

    expect(badged.map((item) => item.label)).toEqual(
      translated(COMING_SOON_KEYS),
    );
    for (const item of badged) {
      expect(item.badge?.label).toBe(t('badgeComingSoon'));
      expect(item.href).toBeUndefined();
    }
  });

  it('links Provisioning and Danger zone, each badged as platform-only', () => {
    expect(labelsOf(platform)).toEqual([t('provisioning'), t('dangerZone')]);
    const [provisioning, dangerZone] = platform.items;

    expect(provisioning?.href).toBe(
      adminRoutes.tenantProvisioning(MOCK_TENANT_ID),
    );
    expect(provisioning?.badge?.label).toBe(t('badgePlatform'));
    expect(dangerZone?.href).toBe(adminRoutes.tenantDanger(MOCK_TENANT_ID));
    expect(dangerZone?.badge?.label).toBe(t('badgePlatform'));
  });

  it('shows the unread lead count on the Leads entry', () => {
    const [, , unreadConfiguration] = tenantNavSections(
      t,
      MOCK_TENANT_ID,
      MOCK_TENANT_NAME,
      MOCK_UNREAD_LEADS_COUNT,
    );

    const leads = itemKeyed(unreadConfiguration!, 'leads');

    expect(leads?.badge?.label).toBe(
      t('badgeUnreadLeads', { count: MOCK_UNREAD_LEADS_COUNT }),
    );
  });
});

describe(dashboardNavSections, () => {
  it("badges the Studio link with the owner's access state", () => {
    const [, content] = dashboardNavSections(
      t,
      EVERY_PLAN_PAGE,
      OWNER_STUDIO_ACCESS.STALLED,
    );

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

describe(navLabelForPathname, () => {
  it('finds the item whose href is the pathname', () => {
    const sections = dashboardNavSections(t, EVERY_PLAN_PAGE);

    const label = navLabelForPathname(sections, adminRoutes.dashboardLook());

    expect(label).toBe(t('look'));
  });

  it('finds the Studio item for a path below the Studio segment', () => {
    const sections = dashboardNavSections(t, EVERY_PLAN_PAGE);

    const label = navLabelForPathname(
      sections,
      `${adminRoutes.dashboardStudio()}/${STUDIO_SEGMENT}`,
    );

    expect(label).toBe(t('studio'));
  });

  it('finds nothing for a path no item links to', () => {
    const sections = dashboardNavSections(t, EVERY_PLAN_PAGE);

    const label = navLabelForPathname(sections, '/nowhere');

    expect(label).toBeUndefined();
  });
});

describe('nav section icons', () => {
  it('registers a glyph for every icon a nav item references', () => {
    const items = [
      ...operatorNavSections(t, ADMIN_ROLE.SUPERADMIN),
      ...tenantNavSections(t, MOCK_TENANT_ID, MOCK_TENANT_NAME),
      ...dashboardNavSections(t, EVERY_PLAN_PAGE),
    ].flatMap((section) => section.items);

    const missing = items
      .filter((item) => !ICON_REGISTRY[item.icon])
      .map((item) => item.label);

    expect(missing).toEqual([]);
  });
});
