import messages from '@admin/i18n/messages/en.json';
import { createTranslator } from 'next-intl';

import {
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
  it('gives Tenants a real href and Add tenant a deferred, hrefless entry', () => {
    const [platform] = platformNavSections(t);
    const tenants = platform!.items.find((item) => item.label === 'Tenants');
    const addTenant = platform!.items.find(
      (item) => item.label === 'Add tenant',
    );

    expect(tenants).toMatchObject({ href: '/tenants' });
    expect(addTenant?.href).toBeUndefined();
    expect(addTenant?.badge).toEqual({ label: 'deferred', tone: 'warn' });
    expect(addTenant?.disabledReason).toBeTruthy();
  });
});

describe('tenantNavSections', () => {
  it('gives Look and Voice distinct real hrefs, badged "this milestone" in neutral tone', () => {
    const [tenant] = tenantNavSections(t, 'acme');
    const look = tenant!.items.find((item) => item.label === 'Look');
    const voice = tenant!.items.find((item) => item.label === 'Voice');

    expect(look?.href).toBe('/t/acme/look');
    expect(voice?.href).toBe('/t/acme/voice');
    expect(look?.href).not.toBe(voice?.href);
    expect(look?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
    expect(voice?.badge).toEqual({ label: 'this milestone', tone: 'neutral' });
  });

  it('badges the remaining six destinations "later" in warn tone, with no href', () => {
    const [tenant] = tenantNavSections(t, 'acme');
    const later = tenant!.items.filter((item) => item.badge?.label === 'later');

    expect(later).toHaveLength(6);
    for (const item of later) {
      expect(item.href).toBeUndefined();
      expect(item.badge?.tone).toBe('warn');
    }
  });

  it('lists all eight tenant destinations', () => {
    const [tenant] = tenantNavSections(t, 'acme');

    expect(tenant!.items.map((item) => item.label)).toEqual([
      'Look',
      'Voice',
      'Domain',
      'Email',
      'Subscribers',
      'Comments',
      'Team',
      'Danger zone',
    ]);
  });
});
