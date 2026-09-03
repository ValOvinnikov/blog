import messages from '@platform/i18n/messages/en.json';
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

  it('gives Look, Voice, Features and Domain distinct real hrefs in the Configuration section, badged "this milestone" in neutral tone', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');
    const features = configuration!.items.find(
      (item) => item.label === 'Features',
    );
    const domain = configuration!.items.find((item) => item.label === 'Domain');

    expect(look?.href).toBe('/tenants/tenant-1/look');
    expect(voice?.href).toBe('/tenants/tenant-1/voice');
    expect(features?.href).toBe('/tenants/tenant-1/features');
    expect(domain?.href).toBe('/tenants/tenant-1/domain');
    expect(look?.href).not.toBe(voice?.href);
    expect(look?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
    expect(voice?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
    expect(features?.badge).toEqual({
      label: 'this milestone',
      tone: 'neutral',
    });
    expect(domain?.badge).toEqual({
      label: 'this milestone',
      tone: 'neutral',
    });
  });

  it('badges the remaining four unbuilt destinations "later" in warn tone, with no href, inside the Configuration section', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const later = configuration!.items.filter(
      (item) => item.badge?.label === 'later',
    );

    expect(later).toHaveLength(4);
    for (const item of later) {
      expect(item.href).toBeUndefined();
      expect(item.badge?.tone).toBe('warn');
    }
  });

  it('lists the eight Configuration-section destinations, Look through Team, with no Studio', () => {
    const [, , configuration] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(configuration!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
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

describe('dashboardNavSections', () => {
  it('lists exactly two sections: Content (Studio) and Configuration (Look, Voice, Features, Domain)', () => {
    const [content, configuration] = dashboardNavSections(t);

    expect(content!.label).toBe('Content');
    expect(configuration!.label).toBe('Configuration');
    expect(content!.items.map((item) => item.label)).toEqual(['Studio']);
    expect(configuration!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Domain',
    ]);
  });

  it('gives Look, Voice, Features, Domain and Studio their /dashboard hrefs', () => {
    const [content, configuration] = dashboardNavSections(t);
    const look = configuration!.items.find((item) => item.label === 'Look');
    const voice = configuration!.items.find((item) => item.label === 'Voice');
    const features = configuration!.items.find(
      (item) => item.label === 'Features',
    );
    const domain = configuration!.items.find((item) => item.label === 'Domain');
    const studio = content!.items.find((item) => item.label === 'Studio');

    expect(look?.href).toBe('/dashboard/look');
    expect(voice?.href).toBe('/dashboard/voice');
    expect(features?.href).toBe('/dashboard/features');
    expect(domain?.href).toBe('/dashboard/domain');
    expect(studio?.href).toBe('/dashboard/studio');
    expect(studio?.badge).toBeUndefined();
  });

  it('never includes Overview, Provisioning or Danger zone — those are platform-only', () => {
    const sections = dashboardNavSections(t);
    const labels = sections.flatMap((section) =>
      section.items.map((item) => item.label),
    );

    expect(labels).not.toContain('Overview');
    expect(labels).not.toContain('Provisioning');
    expect(labels).not.toContain('Danger zone');
  });

  it('drops Email, Subscribers, Comments and Team entirely — no owner-actionable route exists for them yet', () => {
    const sections = dashboardNavSections(t);
    const labels = sections.flatMap((section) =>
      section.items.map((item) => item.label),
    );

    expect(labels).not.toContain('Email');
    expect(labels).not.toContain('Subscribers');
    expect(labels).not.toContain('Comments');
    expect(labels).not.toContain('Team');
  });
});
