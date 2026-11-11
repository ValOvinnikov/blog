import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { getEmailNewPosts } from './get-email-new-posts';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.emailConfig);
});

describe(getEmailNewPosts, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('is on for a tenant with no email config row', async () => {
    expect(await getEmailNewPosts(tenantId)).toBe(true);
  });

  it('is on for a row that never set it', async () => {
    await db().insert(schema.emailConfig).values({ tenantId });

    expect(await getEmailNewPosts(tenantId)).toBe(true);
  });

  it('reads an owner who turned it off', async () => {
    await db()
      .insert(schema.emailConfig)
      .values({ tenantId, emailNewPosts: false });

    expect(await getEmailNewPosts(tenantId)).toBe(false);
  });
});
