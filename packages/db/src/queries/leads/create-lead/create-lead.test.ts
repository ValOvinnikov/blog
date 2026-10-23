import { LOCALE_BCP47_TAGS } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_LEAD_EMAIL,
  MOCK_LEAD_MESSAGE,
  MOCK_LEAD_NAME,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { createLead } from './create-lead';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const LEAD = {
  name: MOCK_LEAD_NAME,
  email: MOCK_LEAD_EMAIL,
  message: MOCK_LEAD_MESSAGE,
  sourcePath: '/en/contact',
};

async function readOnlyLead(): Promise<schema.TLead> {
  const [row, ...others] = await db().select().from(schema.leads);
  if (!row || others.length > 0) throw new Error('Expected exactly one lead.');
  return row;
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(createLead, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores an unread lead and returns only its id', async () => {
    const created = await createLead({ tenantId, ...LEAD });

    const row = await readOnlyLead();
    const { id, name, email, message, sourcePath, readAt } = row;
    expect(created).toEqual({ id });
    expect({ name, email, message, sourcePath, readAt }).toEqual({
      ...LEAD,
      readAt: null,
    });
    expect(row.tenantId).toBe(tenantId);
  });

  it('stores the name, email and message encrypted, and the email index', async () => {
    await createLead({ tenantId, ...LEAD });

    const { nameEncrypted, emailEncrypted, messageEncrypted, emailIndex } =
      await readOnlyLead();
    expect({
      name: decryptTestPersonalValue(nameEncrypted),
      email: decryptTestPersonalValue(emailEncrypted),
      message: decryptTestPersonalValue(messageEncrypted),
      emailIndex,
    }).toEqual({
      name: MOCK_LEAD_NAME,
      email: MOCK_LEAD_EMAIL,
      message: MOCK_LEAD_MESSAGE,
      emailIndex: testPersonalEmailIndex(MOCK_LEAD_EMAIL),
    });
  });

  it.each([
    [
      'stores',
      { sourceDocumentId: 'page-contact', sourceLocale: LOCALE_BCP47_TAGS.EN },
    ],
    ['leaves empty', {}],
  ])('%s the source document and locale', async (_case, source) => {
    await createLead({ tenantId, ...LEAD, ...source });

    const { sourceDocumentId, sourceLocale } = await readOnlyLead();
    expect({ sourceDocumentId, sourceLocale }).toEqual({
      sourceDocumentId: null,
      sourceLocale: null,
      ...source,
    });
  });

  it('rejects a tenant that does not exist', async () => {
    await expect(
      createLead({ tenantId: faker.string.uuid(), ...LEAD }),
    ).rejects.toThrow();
  });

  it('is removed when its tenant is deleted', async () => {
    await createLead({ tenantId, ...LEAD });

    await db().delete(schema.tenants);

    expect(await db().select().from(schema.leads)).toEqual([]);
  });
});
