import type { TMaybeNull } from '@blog/config/types';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
} from '@blog/db/testing/sanity-management-client/fixtures';
import { MOCK_UNKNOWN_SANITY_PROJECT_ID } from '@blog/db/testing/tenants/fixtures';
import { isNull } from '@blog/utils/primitives';

import { getTenantIdBySanityProjectId } from './get-tenant-id-by-sanity-project-id';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function insertTenant(
  sanityProjectId: TMaybeNull<string>,
): Promise<string> {
  const tenant = await insertTestTenant(db(), {
    sanityProjectId,
    sanityDataset: isNull(sanityProjectId) ? null : MOCK_SANITY_DATASET,
  });
  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantIdBySanityProjectId, () => {
  describe('a tenant with a Sanity project', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenant(MOCK_SANITY_PROJECT_ID);
    });

    it('returns the tenant id for a matching sanityProjectId', async () => {
      const result = await getTenantIdBySanityProjectId(MOCK_SANITY_PROJECT_ID);

      expect(result).toBe(tenantId);
    });

    it('returns undefined when no tenant matches', async () => {
      const result = await getTenantIdBySanityProjectId(
        MOCK_UNKNOWN_SANITY_PROJECT_ID,
      );

      expect(result).toBeUndefined();
    });

    it('rejects a second tenant sharing an already-used sanityProjectId', async () => {
      await expect(insertTenant(MOCK_SANITY_PROJECT_ID)).rejects.toThrow();
    });
  });

  describe('tenants with a null sanityProjectId', () => {
    beforeEach(async () => {
      await insertTenant(null);
    });

    it('allows more than one tenant to have a null sanityProjectId', async () => {
      await insertTenant(null);

      const result = await getTenantIdBySanityProjectId(MOCK_SANITY_PROJECT_ID);

      expect(result).toBeUndefined();
    });
  });
});
