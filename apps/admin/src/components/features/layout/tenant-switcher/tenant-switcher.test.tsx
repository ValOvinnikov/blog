import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef } from 'react';

import { TenantSwitcher } from './tenant-switcher';

// `TenantSwitcher` links each tenant through `@admin/i18n/navigation`'s
// `Link` (next-intl's locale-aware navigation), not plain `next/link` —
// mocking the wrong module here would let a broken import ship unnoticed
// (see `sidebar.test.tsx`'s identical mock for `sidebar-nav-link.tsx`).
vi.mock('@admin/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const tenant: TTenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  sanityReadTokenEncrypted: null,
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  provisioningSteps: {
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
  },
  studioVercelProjectId: null,
  seededAt: new Date('2026-01-01T00:00:00.000Z'),
  webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deprovisionedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe(TenantSwitcher, () => {
  it('shows the active tenant on the trigger', () => {
    render(<TenantSwitcher tenants={[tenant]} activeTenantId="tenant-1" />);

    expect(
      screen.getByRole('button', { name: /acme inc\./i }),
    ).toHaveTextContent('acme.example.com');
  });

  it('opens a menu whose accessible name is the active tenant (from the trigger), listing every tenant the user can switch into and linking to its route', async () => {
    const user = userEvent.setup();
    render(<TenantSwitcher tenants={[tenant]} activeTenantId="tenant-1" />);

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute('href', '/t/acme');
  });

  it('links each tenant through a caller-supplied hrefFor instead of the default /t/{slug} route', async () => {
    const user = userEvent.setup();
    render(
      <TenantSwitcher
        tenants={[tenant]}
        activeTenantId="tenant-1"
        hrefFor={(t) => `/dashboard/select-tenant?tenantId=${t.id}`}
      />,
    );

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute(
      'href',
      '/dashboard/select-tenant?tenantId=tenant-1',
    );
  });
});
