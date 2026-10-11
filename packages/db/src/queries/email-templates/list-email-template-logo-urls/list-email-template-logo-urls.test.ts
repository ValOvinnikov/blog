import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listEmailTemplateLogoUrls } from './list-email-template-logo-urls';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.emailTemplateLogos);
  await db().delete(schema.tenants);
});

describe(listEmailTemplateLogoUrls, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns an undefined logo for every template type when none is set', async () => {
    const result = await listEmailTemplateLogoUrls(tenantId);

    expect(result).toEqual(
      Object.fromEntries(
        Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => [
          templateType,
          undefined,
        ]),
      ),
    );
  });

  it("returns each template type's own logo URL", async () => {
    await db().insert(schema.emailTemplateLogos).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      logoAssetUrl: 'https://cdn.example.com/magic-link.png',
    });

    const result = await listEmailTemplateLogoUrls(tenantId);

    expect(result[EMAIL_TEMPLATE_TYPE.MAGIC_LINK]).toBe(
      'https://cdn.example.com/magic-link.png',
    );
    expect(result[EMAIL_TEMPLATE_TYPE.TENANT_INVITE]).toBeUndefined();
  });

  it("ignores another tenant's logos", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.emailTemplateLogos).values({
      tenantId: otherTenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      logoAssetUrl: 'https://cdn.example.com/other.png',
    });

    const result = await listEmailTemplateLogoUrls(tenantId);

    expect(result[EMAIL_TEMPLATE_TYPE.MAGIC_LINK]).toBeUndefined();
  });
});
