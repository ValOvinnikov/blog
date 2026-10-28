import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { RELEASE_FAILURE } from '@platform/constants/release';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import { listFailedMigrationTenants } from './list-failed-migration-tenants';

faker.seed(5285);

const { listActiveTenantsMock } = vi.hoisted(() => ({
  listActiveTenantsMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { listActiveTenants: listActiveTenantsMock } },
}));

describe(listFailedMigrationTenants, () => {
  it('lists only the tenants whose migration failed, the newest failure first', async () => {
    const older = mockTenant({
      id: faker.string.uuid(),
      contentMigrationFailedAt: faker.date.past(),
    });
    const newer = mockTenant({
      id: faker.string.uuid(),
      contentMigrationFailedAt: faker.date.recent(),
    });
    listActiveTenantsMock.mockResolvedValue([
      older,
      mockTenant({ id: faker.string.uuid() }),
      newer,
    ]);

    const result = await listFailedMigrationTenants();

    expect(result).toEqual(
      okResult([
        {
          id: newer.id,
          name: newer.name,
          failedAt: newer.contentMigrationFailedAt,
        },
        {
          id: older.id,
          name: older.name,
          failedAt: older.contentMigrationFailedAt,
        },
      ]),
    );
  });

  it('answers a db failure as a reason code', async () => {
    listActiveTenantsMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await listFailedMigrationTenants();

    expect(result).toEqual(errorResult(RELEASE_FAILURE.DB_ERROR));
  });
});
