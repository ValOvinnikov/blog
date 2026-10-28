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
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { createLead } from './create-lead';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

faker.seed(6024);

const MOCK_SOURCE_DOCUMENT_ID = faker.string.uuid();

const MOCK_LEAD = {
  name: MOCK_LEAD_NAME,
  email: MOCK_LEAD_EMAIL,
  message: MOCK_LEAD_MESSAGE,
  sourcePath: `/${faker.lorem.slug()}`,
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
    const created = await createLead({ tenantId, ...MOCK_LEAD });

    const row = await readOnlyLead();
    const { id, sourcePath, readAt } = row;
    expect(created).toEqual({ id });
    expect({ sourcePath, readAt }).toEqual({
      sourcePath: MOCK_LEAD.sourcePath,
      readAt: null,
    });
    expect(row.tenantId).toBe(tenantId);
  });

  it('encrypts the name, email and message and indexes the email', async () => {
    await createLead({ tenantId, ...MOCK_LEAD });

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
      {
        sourceDocumentId: MOCK_SOURCE_DOCUMENT_ID,
        sourceLocale: LOCALE_BCP47_TAGS.EN,
      },
    ],
    ['leaves empty', {}],
  ])('%s the source document and locale', async (_case, source) => {
    await createLead({ tenantId, ...MOCK_LEAD, ...source });

    const { sourceDocumentId, sourceLocale } = await readOnlyLead();
    expect({ sourceDocumentId, sourceLocale }).toEqual({
      sourceDocumentId: null,
      sourceLocale: null,
      ...source,
    });
  });

  it('rejects a tenant that does not exist', async () => {
    await expect(
      createLead({ tenantId: faker.string.uuid(), ...MOCK_LEAD }),
    ).rejects.toThrow();
  });

  it('is removed when its tenant is deleted', async () => {
    await createLead({ tenantId, ...MOCK_LEAD });

    await db().delete(schema.tenants);

    expect(await db().select().from(schema.leads)).toEqual([]);
  });
});
