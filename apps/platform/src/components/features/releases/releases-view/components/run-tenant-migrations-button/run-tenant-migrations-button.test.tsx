import { ACTION_OUTCOME } from '@blog/config';
import {
  MIGRATION_ENVIRONMENT,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RunTenantMigrationsButton } from './run-tenant-migrations-button';

const { startTenantMigrationsActionMock } = vi.hoisted(() => ({
  startTenantMigrationsActionMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-tenant-migrations-action', () => ({
  startTenantMigrationsAction: startTenantMigrationsActionMock,
}));

const RUN_ON_DEVELOPMENT = { name: 'Run on development' };
const RETRY_TENANT = { name: `Retry ${MOCK_TENANT_NAME} on production` };
const STARTED = 'Tenant migrations started.';
const RETRY_TENANT_PROPS = {
  retryTenant: { id: MOCK_TENANT_ID, name: MOCK_TENANT_NAME },
};

const setup = customRender(RunTenantMigrationsButton, {});

describe(`<${RunTenantMigrationsButton.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    startTenantMigrationsActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('runs every tenant on development, confirms it and refreshes the page', async () => {
    setup();
    const runButton = screen.getByRole('button', RUN_ON_DEVELOPMENT);

    await user.click(runButton);

    const confirmation = await screen.findByText(STARTED);

    expect(startTenantMigrationsActionMock).toHaveBeenCalledWith({
      environment: MIGRATION_ENVIRONMENT.DEVELOPMENT,
    });
    expect(confirmation).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('retries only the named tenant on production', async () => {
    setup(RETRY_TENANT_PROPS);
    const retryButton = screen.getByRole('button', RETRY_TENANT);

    await user.click(retryButton);

    const confirmation = await screen.findByText(STARTED);

    expect(startTenantMigrationsActionMock).toHaveBeenCalledWith({
      environment: MIGRATION_ENVIRONMENT.PRODUCTION,
      tenantId: MOCK_TENANT_ID,
    });
    expect(confirmation).toBeVisible();
  });

  it.each([
    [
      { outcome: ACTION_OUTCOME.SERVER_ERROR },
      'Nothing was started: the tenant migrations could not be dispatched.',
    ],
    [
      { outcome: ACTION_OUTCOME.UNAVAILABLE },
      'The tenant registry could not be read. Try again in a moment.',
    ],
    [
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED,
      },
      "That tenant's last migration did not fail, so there is nothing to retry.",
    ],
  ])('explains a %o answer without refreshing', async (result, message) => {
    startTenantMigrationsActionMock.mockResolvedValue(result);
    setup(RETRY_TENANT_PROPS);
    const retryButton = screen.getByRole('button', RETRY_TENANT);

    await user.click(retryButton);

    const explanation = await screen.findByText(message);

    expect(explanation).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
