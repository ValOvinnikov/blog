import type {
  TStartTenantMigrationsInput,
  TStartTenantMigrationsResult,
} from '@platform/server/releases/start-tenant-migrations-action';

export const startTenantMigrationsAction =
  vi.fn<
    (
      input: TStartTenantMigrationsInput,
    ) => Promise<TStartTenantMigrationsResult>
  >();
