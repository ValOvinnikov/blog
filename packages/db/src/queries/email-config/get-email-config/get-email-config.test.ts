import * as schema from '@blog/db/schema';
import { MOCK_EMAIL_CONFIG } from '@blog/db/testing/email-config/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getEmailConfig } from './get-email-config';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.emailConfig);
  await db().delete(schema.tenants);
});

describe(getEmailConfig, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns undefined when the tenant has no email config row', async () => {
    const result = await getEmailConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null columns to undefined', async () => {
    await db().insert(schema.emailConfig).values({ tenantId });

    const result = await getEmailConfig(tenantId);

    expect(result).toMatchObject({
      tenantId,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
      contactRecipient: undefined,
    });
  });

  it('returns every set field', async () => {
    await db()
      .insert(schema.emailConfig)
      .values({ tenantId, ...MOCK_EMAIL_CONFIG });

    const result = await getEmailConfig(tenantId);

    expect(result).toMatchObject({ tenantId, ...MOCK_EMAIL_CONFIG });
  });
});
