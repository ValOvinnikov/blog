import * as schema from '@shinefold/db/schema';
import { MOCK_EMAIL_CONFIG } from '@shinefold/db/testing/email-config/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getEmailConfig } from './get-email-config';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

describe(getEmailConfig, () => {
  it('returns undefined when the tenant has no email config row', async () => {
    const { id: tenantId } = tenant();

    const result = await getEmailConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null columns to undefined', async () => {
    const { id: tenantId } = tenant();
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
    const { id: tenantId } = tenant();
    await db()
      .insert(schema.emailConfig)
      .values({ tenantId, ...MOCK_EMAIL_CONFIG });

    const result = await getEmailConfig(tenantId);

    expect(result).toMatchObject({ tenantId, ...MOCK_EMAIL_CONFIG });
  });
});
