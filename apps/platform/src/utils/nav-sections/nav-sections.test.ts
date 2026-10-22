import { ADMIN_ROLE } from '@blog/db/constants';
import { ICON_REGISTRY } from '@platform/components/shared/icon/icon-registry';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { makeEnTranslator } from '@platform/testing/en-translator';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';

import {
  dashboardNavSections,
  operatorNavSections,
  tenantNavSections,
} from './nav-sections';

const t = makeEnTranslator('navSections');

const TENANT_ID = 'tenant-1';
const TENANT_NAME = 'Acme Co';
const BLOCKED_SIGNUPS_LABEL = 'Blocked sign-ups';
const COMING_SOON_LABEL = 'Coming soon';
const PLATFORM_BADGE_LABEL = 'platform';
const PROVISIONING_LABEL = 'Provisioning';
const DANGER_ZONE_LABEL = 'Danger zone';

describe('operatorNavSections', () => {
  it('gives both Tenants and Add tenant real hrefs', () => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.ADMIN);
    const tenants = platform!.items.find((item) => item.label === 'Tenants');
    const addTenant = platform!.items.find(
      (item) => item.label === 'Add tenant',
    );

    expect(tenants).toMatchObject({ href: adminRoutes.tenants() });
    expect(addTenant).toMatchObject({ href: adminRoutes.newTenant() });
    expect(addTenant?.badge).toBeUndefined();
  });

  it('gives Findings a real href, unbadged', () => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.ADMIN);
    const findings = platform!.items.find((item) => item.label === 'Findings');

    expect(findings).toMatchObject({ href: '/findings' });
    expect(findings?.badge).toBeUndefined();
  });

  it('gives a SUPERADMIN a Releases entry', () => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.SUPERADMIN);

    expect(
      platform!.items.find((item) => item.label === 'Releases'),
    ).toMatchObject({ href: '/releases' });
  });

  it('gives a SUPERADMIN a Blocked sign-ups entry', () => {
    const [platform] = operatorNavSections(t, ADMIN_ROLE.SUPERADMIN);

    expect(
      platform!.items.find((item) => item.label === BLOCKED_SIGNUPS_LABEL),
    ).toMatchObject({ href: adminRoutes.blockedSignups() });
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'omits the Blocked sign-ups entry for a %s',
    (role) => {
      const [platform] = operatorNavSections(t, role);

      expect(platform!.items.map((item) => item.label)).not.toContain(
        BLOCKED_SIGNUPS_LABEL,
      );
    },
  );

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'omits the Releases entry for a %s',
    (role) => {
      const [platform] = operatorNavSections(t, role);

      expect(platform!.items.map((item) => item.label)).not.toContain(
        'Releases',
      );
    },
  );
});

describe('tenantNavSections', () => {
  it("labels the main section with the tenant's name, not its id", () => {
    const [tenant] = tenantNavSections(t, TENANT_ID, TENANT_NAME);

    expect(tenant!.label).toBe('Tenant · Acme Co');
    expect(tenant!.label).not.toContain(TENANT_ID);
  });

  it('gives the main, content, configuration and platform sections distinct labels', () => {
    const [tenant, content, configuration, platform] = tenantNavSections(
      t,
      TENANT_ID,
      TENANT_NAME,
    );
    const labels = [
      tenant!.label,
      content!.label,
      configuration!.label,
      platform!.label,
    ];

    expect(new Set(labels).size).toBe(labels.length);
    expect(content!.label).toBe('Content');
    expect(configuration!.label).toBe('Configuration');
  });

  it('gives Overview a real href as the only item in the main section', () => {
    const [tenant] = tenantNavSections(t, TENANT_ID, TENANT_NAME);

    expect(tenant!.items.map((item) => item.label)).toEqual(['Overview']);
    expect(tenant!.items[0]).toMatchObject({
      label: 'Overview',
      href: adminRoutes.tenantOverview(TENANT_ID),
    });
  });

  it('puts Studio alone in the Content section, with a real href and no badge', () => {
    const [, content] = tenantNavSections(t, TENANT_ID, TENANT_NAME);

    expect(content!.items.map((item) => item.label)).toEqual(['Studio']);
    expect(content!.items[0]).toMatchObject({
      href: adminRoutes.tenantStudio(TENANT_ID),
    });
    expect(content!.items[0]?.badge).toBeUndefined();
  });

  it('gives Look, Voice, Features, Domain and Email distinct real hrefs in the Configuration section', () => {
    const [, , configuration] = tenantNavSections(t, TENANT_ID, TENANT_NAME);
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');
    const features = configuration!.items.find(
      (item) => item.label === 'Features',
    );
    const domain = configuration!.items.find((item) => item.label === 'Domain');
    const email = configuration!.items.find((item) => item.label === 'Email');

    expect(look?.href).toBe(adminRoutes.look(TENANT_ID));
    expect(voice?.href).toBe(adminRoutes.voice(TENANT_ID));
    expect(features?.href).toBe(adminRoutes.features(TENANT_ID));
    expect(
      configuration!.items.find((item) => item.label === 'Leads')?.href,
    ).toBe(adminRoutes.leads(TENANT_ID));
    expect(domain?.href).toBe(adminRoutes.tenantDomain(TENANT_ID));
    expect(email?.href).toBe(adminRoutes.email(TENANT_ID));
    expect(look?.href).not.toBe(voice?.href);
  });

  it('leaves Look and Voice unbadged, now that both have shipped', () => {
    const [, , configuration] = tenantNavSections(t, TENANT_ID, TENANT_NAME);
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');

    expect(look?.badge).toBeUndefined();
    expect(voice?.badge).toBeUndefined();
  });

  it('leaves Features, Languages, Domain and Email unbadged', () => {
    const [, , configuration] = tenantNavSections(t, TENANT_ID, TENANT_NAME);
    const shipped = configuration!.items.filter((item) =>
      ['Features', 'Languages', 'Domain', 'Email'].includes(item.label),
    );

    expect(shipped).toHaveLength(4);
    for (const item of shipped) {
      expect(item.badge).toBeUndefined();
    }
  });

  it('shows Subscribers, Comments and Team as non-interactive "Coming soon" entries', () => {
    const [, , configuration] = tenantNavSections(t, TENANT_ID, TENANT_NAME);
    const comingSoon = configuration!.items.filter(
      (item) => item.badge?.label === COMING_SOON_LABEL,
    );

    expect(comingSoon.map((item) => item.label)).toEqual([
      'Subscribers',
      'Comments',
      'Team',
    ]);
    for (const item of comingSoon) {
      expect(item.href).toBeUndefined();
    }
  });

  it('carries no "this milestone" or "later" badge on any entry', () => {
    const labels = tenantNavSections(t, TENANT_ID, TENANT_NAME).flatMap(
      (section) => section.items.map((item) => item.badge?.label),
    );

    expect(labels).not.toContain('this milestone');
    expect(labels).not.toContain('later');
  });

  it('lists the ten Configuration destinations, Look through Team, with no Studio', () => {
    const [, , configuration] = tenantNavSections(t, TENANT_ID, TENANT_NAME);

    expect(configuration!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Leads',
      'Languages',
      'Domain',
      'Email',
      'Subscribers',
      'Comments',
      'Team',
    ]);
  });

  it('gives Provisioning and Danger zone real hrefs in the platform-only section, each badged "platform"', () => {
    const [, , , platform] = tenantNavSections(t, TENANT_ID, TENANT_NAME);

    expect(platform!.items.map((item) => item.label)).toEqual([
      PROVISIONING_LABEL,
      DANGER_ZONE_LABEL,
    ]);
    expect(platform!.items[0]).toMatchObject({
      href: adminRoutes.tenantProvisioning(TENANT_ID),
      badge: { label: PLATFORM_BADGE_LABEL, tone: 'neutral', hasDot: false },
    });
    expect(platform!.items[1]).toMatchObject({
      href: adminRoutes.tenantDanger(TENANT_ID),
      badge: { label: PLATFORM_BADGE_LABEL, tone: 'neutral', hasDot: false },
    });
  });
});

const EVERY_PAGE: TPlanPageAccess = {
  languages: true,
  email: true,
  leads: true,
  subscribers: true,
  comments: true,
  team: true,
};

const NO_PAGE: TPlanPageAccess = {
  languages: false,
  email: false,
  leads: false,
  subscribers: false,
  comments: false,
  team: false,
};

const configurationLabels = (access: TPlanPageAccess) => {
  const [, , configuration] = dashboardNavSections(t, access);
  return configuration!.items.map((item) => item.label);
};

describe('dashboardNavSections', () => {
  it("badges the Studio link with the owner's access state", () => {
    const [, content] = dashboardNavSections(
      t,
      EVERY_PAGE,
      OWNER_STUDIO_ACCESS.STALLED,
    );

    expect(content!.items[0]?.badge?.label).toBe('Action needed');
  });

  it('opens with a "Your site" section whose only item is Overview, linking to /dashboard', () => {
    const [yourSite] = dashboardNavSections(t, EVERY_PAGE);

    expect(yourSite!.label).toBe('Your site');
    expect(yourSite!.items).toEqual([
      expect.objectContaining({
        label: 'Overview',
        href: adminRoutes.dashboard(),
      }),
    ]);
  });

  it('lists Content (Studio) and Configuration, with every page the plan can use', () => {
    const [, content, configuration] = dashboardNavSections(t, EVERY_PAGE);

    expect(content!.label).toBe('Content');
    expect(configuration!.label).toBe('Configuration');
    expect(content!.items.map((item) => item.label)).toEqual(['Studio']);
    expect(configurationLabels(EVERY_PAGE)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Leads',
      'Languages',
      'Domain',
      'Email',
      'Subscribers',
      'Comments',
      'Team',
    ]);
  });

  it('keeps only the pages every plan can use when the plan allows none of the gated ones', () => {
    expect(configurationLabels(NO_PAGE)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Domain',
    ]);
  });

  it.each([
    ['languages', 'Languages'],
    ['email', 'Email'],
    ['leads', 'Leads'],
    ['subscribers', 'Subscribers'],
    ['comments', 'Comments'],
    ['team', 'Team'],
  ] as const)('shows %s only when the plan can use it', (page, label) => {
    expect(configurationLabels({ ...NO_PAGE, [page]: true })).toContain(label);
    expect(configurationLabels({ ...EVERY_PAGE, [page]: false })).not.toContain(
      label,
    );
  });

  it('shows Subscribers, Comments and Team as non-interactive entries on the dashboard', () => {
    const [, , configuration] = dashboardNavSections(t, EVERY_PAGE);
    const comingSoon = configuration!.items.filter(
      (item) => item.badge?.label === COMING_SOON_LABEL,
    );

    expect(comingSoon.map((item) => item.label)).toEqual([
      'Subscribers',
      'Comments',
      'Team',
    ]);
    for (const item of comingSoon) {
      expect(item.href).toBeUndefined();
    }
  });

  it('gives Look, Voice, Features, Languages, Domain, Email and Studio their /dashboard hrefs', () => {
    const [, content, configuration] = dashboardNavSections(t, EVERY_PAGE);
    const hrefOf = (label: string) =>
      configuration!.items.find((item) => item.label === label)?.href;

    expect(hrefOf('Look')).toBe(adminRoutes.dashboardLook());
    expect(hrefOf('Voice')).toBe(adminRoutes.dashboardVoice());
    expect(hrefOf('Features')).toBe(adminRoutes.dashboardFeatures());
    expect(hrefOf('Leads')).toBe(adminRoutes.dashboardLeads());
    expect(hrefOf('Languages')).toBe(adminRoutes.dashboardLanguages());
    expect(hrefOf('Domain')).toBe(adminRoutes.dashboardDomain());
    expect(hrefOf('Email')).toBe(adminRoutes.dashboardEmail());
    expect(content!.items[0]).toMatchObject({
      href: adminRoutes.dashboardStudio(),
    });
    expect(content!.items[0]?.badge).toBeUndefined();
  });

  it('never includes Provisioning, Danger zone or a "Tenant · …" label', () => {
    const sections = dashboardNavSections(t, EVERY_PAGE);
    const labels = [
      ...sections.map((section) => section.label),
      ...sections.flatMap((section) => section.items.map((item) => item.label)),
    ];

    expect(labels).not.toContain(PROVISIONING_LABEL);
    expect(labels).not.toContain(DANGER_ZONE_LABEL);
    expect(labels.filter((label) => label.startsWith('Tenant'))).toEqual([]);
  });
});

describe('nav section icons', () => {
  it('has a registered glyph for every icon a nav item references', () => {
    const items = [
      ...operatorNavSections(t, ADMIN_ROLE.SUPERADMIN),
      ...tenantNavSections(t, TENANT_ID, 'Acme'),
      ...dashboardNavSections(t, EVERY_PAGE),
    ].flatMap((section) => section.items);

    const missing = items
      .filter((item) => !ICON_REGISTRY[item.icon])
      .map((item) => item.label);

    expect(missing).toEqual([]);
  });
});
