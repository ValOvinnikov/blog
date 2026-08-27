import messages from '@admin/i18n/messages/en.json';
import { createTranslator } from 'next-intl';

import {
  dashboardNavSections,
  platformNavSections,
  tenantNavSections,
  type TNavTranslator,
} from './nav-sections';

const t = createTranslator({
  locale: 'EN',
  messages,
  namespace: 'navSections',
}) as unknown as TNavTranslator;

describe('platformNavSections', () => {
  it('gives both Tenants and Add tenant real hrefs', () => {
    const [platform] = platformNavSections(t);
    const tenants = platform!.items.find((item) => item.label === 'Tenants');
    const addTenant = platform!.items.find(
      (item) => item.label === 'Add tenant',
    );

    expect(tenants).toMatchObject({ href: '/tenants' });
    expect(addTenant).toMatchObject({ href: '/add-tenant' });
    expect(addTenant?.badge).toBeUndefined();
  });
});

describe('tenantNavSections', () => {
  it("labels the main section with the tenant's name, not its id", () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.label).toBe('Tenant · Acme Co');
    expect(tenant!.label).not.toContain('tenant-1');
  });

  it('gives the main and platform sections distinct labels', () => {
    const [tenant, platform] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.label).not.toBe(platform!.label);
  });

  it('gives Overview a real href as the first item', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.items[0]).toMatchObject({
      label: 'Overview',
      href: '/tenants/tenant-1',
    });
  });

  it('gives Look, Voice, Features and Domain distinct real hrefs, badged "this milestone" in neutral tone', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const look = tenant!.items.find((item) => item.label === 'Look');
    const voice = tenant!.items.find((item) => item.label === 'Voice');
    const features = tenant!.items.find((item) => item.label === 'Features');
    const domain = tenant!.items.find((item) => item.label === 'Domain');

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

  it('badges the remaining four unbuilt destinations "later" in warn tone, with no href', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');
    const later = tenant!.items.filter((item) => item.badge?.label === 'later');

    expect(later).toHaveLength(4);
    for (const item of later) {
      expect(item.href).toBeUndefined();
      expect(item.badge?.tone).toBe('warn');
    }
  });

  it('lists the nine main-section destinations, Overview first and no Danger zone', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1', 'Acme Co');

    expect(tenant!.items.map((item) => item.label)).toEqual([
      'Overview',
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

  it('gives Provisioning and Danger zone real hrefs in the second, platform-only section, each badged "platform"', () => {
    const [, platform] = tenantNavSections(t, 'tenant-1', 'Acme Co');

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
  it('gives Look, Voice, Features and Domain their slug-free /dashboard hrefs', () => {
    const [dashboard] = dashboardNavSections(t);
    const look = dashboard!.items.find((item) => item.label === 'Look');
    const voice = dashboard!.items.find((item) => item.label === 'Voice');
    const features = dashboard!.items.find((item) => item.label === 'Features');
    const domain = dashboard!.items.find((item) => item.label === 'Domain');

    expect(look?.href).toBe('/dashboard/look');
    expect(voice?.href).toBe('/dashboard/voice');
    expect(features?.href).toBe('/dashboard/features');
    expect(domain?.href).toBe('/dashboard/domain');
  });

  it('never includes Overview, Provisioning or Danger zone — those are platform-only', () => {
    const [dashboard] = dashboardNavSections(t);

    const labels = dashboard!.items.map((item) => item.label);
    expect(labels).not.toContain('Overview');
    expect(labels).not.toContain('Provisioning');
    expect(labels).not.toContain('Danger zone');
  });

  it('drops Email, Subscribers, Comments and Team entirely — no owner-actionable route exists for them yet', () => {
    const [dashboard] = dashboardNavSections(t);

    const labels = dashboard!.items.map((item) => item.label);
    expect(labels).not.toContain('Email');
    expect(labels).not.toContain('Subscribers');
    expect(labels).not.toContain('Comments');
    expect(labels).not.toContain('Team');
  });

  it('lists exactly the four shipping tenant-facing destinations', () => {
    const [dashboard] = dashboardNavSections(t);

    expect(dashboard!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Domain',
    ]);
  });
});
