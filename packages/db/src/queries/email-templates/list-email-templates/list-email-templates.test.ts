import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listEmailTemplates } from './list-email-templates';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.tenants);
});

describe(listEmailTemplates, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns one entry per template type, even with no rows at all', async () => {
    const result = await listEmailTemplates(tenantId);

    expect(result.map((entry) => entry.templateType).sort()).toEqual(
      Object.values(EMAIL_TEMPLATE_TYPE).sort(),
    );
  });

  it('mixes authored and default entries across template types', async () => {
    await db().insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      subject: 'Custom sign-in subject',
    });

    const result = await listEmailTemplates(tenantId);

    const magicLink = result.find(
      (entry) => entry.templateType === EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );
    const invite = result.find(
      (entry) => entry.templateType === EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    );

    expect(magicLink?.subject).toBe('Custom sign-in subject');
    expect(invite?.subject).not.toBe('Custom sign-in subject');
  });

  it('resolves every entry in the requested language', async () => {
    await db().insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.NL,
      subject: 'Eigen onderwerp',
    });

    const result = await listEmailTemplates(tenantId, LOCALE_ISO_CODES.NL);

    expect(
      result.map(({ templateType, subject }) => [templateType, subject]),
    ).toEqual(
      Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => [
        templateType,
        templateType === EMAIL_TEMPLATE_TYPE.MAGIC_LINK
          ? 'Eigen onderwerp'
          : EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.NL[templateType].subject,
      ]),
    );
  });
});
