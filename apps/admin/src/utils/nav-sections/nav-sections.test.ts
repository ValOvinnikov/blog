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
  it('gives Look, Voice and Features distinct real hrefs, badged "this milestone" in neutral tone', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1');
    const look = tenant!.items.find((item) => item.label === 'Look');
    const voice = tenant!.items.find((item) => item.label === 'Voice');
    const features = tenant!.items.find((item) => item.label === 'Features');

    expect(look?.href).toBe('/tenants/tenant-1/look');
    expect(voice?.href).toBe('/tenants/tenant-1/voice');
    expect(features?.href).toBe('/tenants/tenant-1/features');
    expect(look?.href).not.toBe(voice?.href);
    expect(look?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
    expect(voice?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
    expect(features?.badge).toEqual({
      label: 'this milestone',
      tone: 'neutral',
    });
  });

  it('badges the remaining six destinations "later" in warn tone, with no href', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1');
    const later = tenant!.items.filter((item) => item.badge?.label === 'later');

    expect(later).toHaveLength(6);
    for (const item of later) {
      expect(item.href).toBeUndefined();
      expect(item.badge?.tone).toBe('warn');
    }
  });

  it('lists all nine tenant destinations', () => {
    const [tenant] = tenantNavSections(t, 'tenant-1');

    expect(tenant!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Features',
      'Domain',
      'Email',
      'Subscribers',
      'Comments',
      'Team',
      'Danger zone',
    ]);
  });
});

describe('dashboardNavSections', () => {
  it('gives Look, Voice and Features their slug-free /dashboard hrefs', () => {
    const [dashboard] = dashboardNavSections(t);
    const look = dashboard!.items.find((item) => item.label === 'Look');
    const voice = dashboard!.items.find((item) => item.label === 'Voice');
    const features = dashboard!.items.find((item) => item.label === 'Features');

    expect(look?.href).toBe('/dashboard/look');
    expect(voice?.href).toBe('/dashboard/voice');
    expect(features?.href).toBe('/dashboard/features');
  });

  it('lists the same nine destinations as tenantNavSections', () => {
    const [dashboard] = dashboardNavSections(t);
    const [tenant] = tenantNavSections(t, 'tenant-1');

    expect(dashboard!.items.map((item) => item.label)).toEqual(
      tenant!.items.map((item) => item.label),
    );
  });
});
