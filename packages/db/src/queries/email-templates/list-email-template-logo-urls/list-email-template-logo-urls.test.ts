import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_LOGO_URL,
  MOCK_OTHER_LOGO_URL,
} from '@blog/db/testing/email-templates/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listEmailTemplateLogoUrls } from './list-email-template-logo-urls';

vi.mock('@blog/db/client');

const MOCK_NO_LOGO_URLS = Object.fromEntries(
  Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => [
    templateType,
    undefined,
  ]),
);

const db = useQueryTestDb();

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

    expect(result).toEqual(MOCK_NO_LOGO_URLS);
  });

  it("returns each template type's own logo URL", async () => {
    await db().insert(schema.emailTemplateLogos).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      logoAssetUrl: MOCK_LOGO_URL,
    });

    const result = await listEmailTemplateLogoUrls(tenantId);

    expect(result).toEqual({
      ...MOCK_NO_LOGO_URLS,
      [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: MOCK_LOGO_URL,
    });
  });

  it("ignores another tenant's logos", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.emailTemplateLogos).values({
      tenantId: otherTenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      logoAssetUrl: MOCK_OTHER_LOGO_URL,
    });

    const result = await listEmailTemplateLogoUrls(tenantId);

    expect(result).toEqual(MOCK_NO_LOGO_URLS);
  });
});
