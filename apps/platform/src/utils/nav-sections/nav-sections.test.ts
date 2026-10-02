import messages from '@platform/i18n/messages/en.json';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { createTranslator } from 'next-intl';

import {
  dashboardNavSections,
  operatorNavSections,
  tenantNavSections,
  type TNavTranslator,
} from './nav-sections';

const t = createTranslator({
  locale: 'EN',
  messages,
  namespace: 'navSections',
}) as unknown as TNavTranslator;

describe('operatorNavSections', () => {
  it('gives both Tenants and Add tenant real hrefs', () => {
    const [platform] = operatorNavSections(t);
    const tenants = platform!.items.find((item) => item.label === 'Tenants');
    const addTenant = platform!.items.find(
      (item) => item.label === 'Add tenant',
    );

    expect(tenants).toMatchObject({ href: '/tenants' });
    expect(addTenant).toMatchObject({ href: '/tenants/new' });
    expect(addTenant?.badge).toBeUndefined();
  });

  it('gives Findings a real href, unbadged', () => {
    const [platform] = operatorNavSections(t);
    const findings = platform!.items.find((item) => item.label === 'Findings');

    expect(findings).toMatchObject({ href: '/findings' });
    expect(findings?.badge).toBeUndefined();
  });
});

describe('tenantNavSections', () => {
  it("labels the main section with the tenant's name, not its id", () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.label).toBe('Tenant · Acme Co');
    expect(tenant!.label).not.toContain('tenant-1');
  });

  it('gives the main, content, configuration and platform sections distinct labels', () => {
    const [tenant, content, configuration, platform] = tenantNavSections(
      t,
      'tenant-1',
      'Acme Co',
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
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.items.map((item) => item.label)).toEqual(['Overview']);
    expect(tenant!.items[0]).toMatchObject({
      label: 'Overview',
      href: '/tenants/tenant-1',
    });
  });

  it('puts Studio alone in the Content section, with a real href and no badge', () => {
    const [, content] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(content!.items.map((item) => item.label)).toEqual(['Studio']);
    expect(content!.items[0]).toMatchObject({
      href: '/tenants/tenant-1/studio',
    });
    expect(content!.items[0]?.badge).toBeUndefined();
  });

  it('gives Look, Voice, Features, Domain and Email distinct real hrefs in the Configuration section', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');
    const features = configuration!.items.find(
      (item) => item.label === 'Features',
    );
    const domain = configuration!.items.find((item) => item.label === 'Domain');
    const email = configuration!.items.find((item) => item.label === 'Email');

    expect(look?.href).toBe('/tenants/tenant-1/look');
    expect(voice?.href).toBe('/tenants/tenant-1/voice');
    expect(features?.href).toBe('/tenants/tenant-1/features');
    expect(domain?.href).toBe('/tenants/tenant-1/domain');
    expect(email?.href).toBe('/tenants/tenant-1/email');
    expect(look?.href).not.toBe(voice?.href);
  });

  it('leaves Look and Voice unbadged, now that both have shipped', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');

    expect(look?.badge).toBeUndefined();
    expect(voice?.badge).toBeUndefined();
  });

  it('leaves Features, Languages, Domain and Email unbadged', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const shipped = configuration!.items.filter((item) =>
      ['Features', 'Languages', 'Domain', 'Email'].includes(item.label),
    );

    expect(shipped).toHaveLength(4);
    for (const item of shipped) {
      expect(item.badge).toBeUndefined();
    }
  });

  it('shows Subscribers, Comments and Team as non-interactive "Coming soon" entries', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const comingSoon = configuration!.items.filter(
      (item) => item.badge?.label === 'Coming soon',
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
    const labels = tenantNavSections(t, 'tenant-1', 'Acme Co').flatMap(
      (section) => section.items.map((item) => item.badge?.label),
    );

    expect(labels).not.toContain('this milestone');
    expect(labels).not.toContain('later');
  });

  it('lists the nine Configuration-section destinations, Look through Team, with no Studio', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(configuration!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Languages',
      'Domain',
      'Email',
      'Subscribers',
      'Comments',
      'Team',
    ]);
  });

  it('gives Provisioning and Danger zone real hrefs in the platform-only section, each badged "platform"', () => {
    const [, , , platform] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(platform!.items.map((item) => item.label)).toEqual([
      'Provisioning',
      'Danger zone',
    ]);
    expect(platform!.items[0]).toMatchObject({
      href: '/tenants/tenant-1/provisioning',
      badge: { label: 'platform', tone: 'neutral', hasDot: false },
    });
    expect(platform!.items[1]).toMatchObject({
      href: '/tenants/tenant-1/danger',
      badge: { label: 'platform', tone: 'neutral', hasDot: false },
    });
  });
});

const EVERY_PAGE: TPlanPageAccess = {
  languages: true,
  email: true,
  subscribers: true,
  comments: true,
  team: true,
};

const NO_PAGE: TPlanPageAccess = {
  languages: false,
  email: false,
  subscribers: false,
  comments: false,
  team: false,
};

const configurationLabels = (access: TPlanPageAccess) => {
  const [, configuration] = dashboardNavSections(t, access);
  return configuration!.items.map((item) => item.label);
};

describe('dashboardNavSections', () => {
  it('lists Content (Studio) and Configuration, with every page the plan can use', () => {
    const [content, configuration] = dashboardNavSections(t, EVERY_PAGE);

    expect(content!.label).toBe('Content');
    expect(configuration!.label).toBe('Configuration');
    expect(content!.items.map((item) => item.label)).toEqual(['Studio']);
    expect(configurationLabels(EVERY_PAGE)).toEqual([
      'Look',
      'Voice',
      'Features',
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
    ['subscribers', 'Subscribers'],
    ['comments', 'Comments'],
    ['team', 'Team'],
  ] as const)('shows %s only when the plan can use it', (page, label) => {
    expect(configurationLabels({ ...NO_PAGE, [page]: true })).toContain(label);
    expect(configurationLabels({ ...EVERY_PAGE, [page]: false })).not.toContain(
      label,
    );
  });

  it('shows Subscribers, Comments and Team as non-interactive "Coming soon" entries', () => {
    const [, configuration] = dashboardNavSections(t, EVERY_PAGE);
    const comingSoon = configuration!.items.filter(
      (item) => item.badge?.label === 'Coming soon',
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
    const [content, configuration] = dashboardNavSections(t, EVERY_PAGE);
    const hrefOf = (label: string) =>
      configuration!.items.find((item) => item.label === label)?.href;

    expect(hrefOf('Look')).toBe('/dashboard/look');
    expect(hrefOf('Voice')).toBe('/dashboard/voice');
    expect(hrefOf('Features')).toBe('/dashboard/features');
    expect(hrefOf('Languages')).toBe('/dashboard/languages');
    expect(hrefOf('Domain')).toBe('/dashboard/domain');
    expect(hrefOf('Email')).toBe('/dashboard/email');
    expect(content!.items[0]).toMatchObject({ href: '/dashboard/studio' });
    expect(content!.items[0]?.badge).toBeUndefined();
  });

  it('never includes Overview, Provisioning or Danger zone — those are platform-only', () => {
    const labels = dashboardNavSections(t, EVERY_PAGE).flatMap((section) =>
      section.items.map((item) => item.label),
    );

    expect(labels).not.toContain('Overview');
    expect(labels).not.toContain('Provisioning');
    expect(labels).not.toContain('Danger zone');
  });
});
