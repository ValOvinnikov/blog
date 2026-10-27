import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_VALUES } from '@blog/db/testing/tenants/fixtures';
import {
  MOCK_SELF_SERVE_DOMAIN,
  MOCK_SELF_SERVE_PADDED_DOMAIN,
  MOCK_SELF_SERVE_SCHEME_DOMAIN,
} from '@blog/db/testing/tenants/self-serve-fixtures';

import { createTenant, type TCreateTenantInput } from './create-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_TENANT_INPUT: TCreateTenantInput = {
  ...MOCK_TENANT_VALUES,
  status: TENANT_STATUS.ACTIVE,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(createTenant, () => {
  it('inserts a tenant row from the input and returns it', async () => {
    const result = await createTenant(MOCK_TENANT_INPUT);

    const [row] = await db().select().from(schema.tenants);
    const {
      name,
      primaryDomain,
      sanityProjectId,
      sanityDataset,
      locale,
      plan,
      status,
    } = row ?? {};
    expect(result).toEqual({ ok: true, data: row });
    expect({
      name,
      primaryDomain,
      sanityProjectId,
      sanityDataset,
      locale,
      plan,
      status,
    }).toEqual(MOCK_TENANT_INPUT);
  });

  it.each([
    ['a scheme-prefixed value', MOCK_SELF_SERVE_SCHEME_DOMAIN],
    ['a trailing-slash value', `${MOCK_SELF_SERVE_DOMAIN}/`],
    ['a whitespace-padded value', MOCK_SELF_SERVE_PADDED_DOMAIN],
  ])(
    'rejects %s for primaryDomain without writing a row',
    async (_description, primaryDomain) => {
      const result = await createTenant({
        ...MOCK_TENANT_INPUT,
        primaryDomain,
      });

      const rows = await db().select().from(schema.tenants);
      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      });
      expect(rows).toEqual([]);
    },
  );
});
