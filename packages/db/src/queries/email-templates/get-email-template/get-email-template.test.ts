import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getEmailTemplate } from './get-email-template';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.emailTemplates);
  await db.delete(schema.tenants);
});

describe(getEmailTemplate, () => {
  it('returns full product defaults when no row exists for the template type', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject,
      body: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body,
      logoAssetUrl: undefined,
    });
  });

  // The behaviour the merge exists for: a row that only ever had `subject`
  // written to it (never `body`) must still render the default body, proving
  // the merge happens per field rather than "the row exists, so use the
  // whole row as-is."
  it('renders the default body when only the subject has been authored', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: 'Custom sign-in subject',
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe('Custom sign-in subject');
    expect(result.body).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body);
  });

  it('renders the default subject when only the body has been authored', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const customBody = [
      {
        _type: 'block',
        _key: 'custom-1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'custom-1-span',
            text: 'Custom body.',
            marks: [],
          },
        ],
      },
    ];
    await db.insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      body: customBody,
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject);
    expect(result.body).toEqual(customBody);
  });

  it('returns the authored logoAssetUrl when set, and undefined when not', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      logoAssetUrl: 'https://blob.example.com/newsletter-logo.png',
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
    );

    expect(result.logoAssetUrl).toBe(
      'https://blob.example.com/newsletter-logo.png',
    );

    const other = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    );
    expect(other.logoAssetUrl).toBeUndefined();
  });
});
