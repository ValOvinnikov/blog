import { RELEASE_FAILURE } from '@platform/constants/release';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockFailedMigrationTenant,
  RUN_ON_DEVELOPMENT,
} from '@platform/testing/releases/fixtures';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { errorResult, okResult } from '@shinefold/utils';

import { TenantMigrationsCard } from './tenant-migrations-card';

vi.mock('@platform/server/releases/start-tenant-migrations-action', () => ({
  startTenantMigrationsAction: vi.fn(),
}));

const RETRY_ON_PRODUCTION = /on production/;

const setup = customRender(TenantMigrationsCard, {
  failedTenants: okResult([]),
});

describe(`<${TenantMigrationsCard.name}/>`, () => {
  it('offers a development run and no production control when no migration failed', () => {
    setup();

    const runButton = screen.getByRole('button', RUN_ON_DEVELOPMENT);
    const empty = screen.getByText("No tenant's content migration has failed.");
    const retryButton = screen.queryByRole('button', {
      name: RETRY_ON_PRODUCTION,
    });

    expect(runButton).toBeVisible();
    expect(empty).toBeVisible();
    expect(retryButton).not.toBeInTheDocument();
  });

  it('offers a production retry for a tenant whose migration failed', () => {
    setup({ failedTenants: okResult([mockFailedMigrationTenant()]) });

    const tenant = screen.getByText(MOCK_TENANT_NAME);
    const retryButton = screen.getByRole('button', {
      name: `Retry ${MOCK_TENANT_NAME} on production`,
    });

    expect(tenant).toBeVisible();
    expect(retryButton).toBeVisible();
  });

  it('says the failed tenants are unavailable when the registry cannot be read', () => {
    setup({ failedTenants: errorResult(RELEASE_FAILURE.DB_ERROR) });

    const notice = screen.getByText('Failed migrations are unavailable');
    const retryButton = screen.queryByRole('button', {
      name: RETRY_ON_PRODUCTION,
    });

    expect(notice).toBeVisible();
    expect(retryButton).not.toBeInTheDocument();
  });
});
