import { faker } from '@faker-js/faker';
import { LOCALE_BCP47_TAGS } from '@shinefold/config';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_LEAD_EMAIL,
  MOCK_LEAD_MESSAGE,
  MOCK_LEAD_NAME,
} from '@shinefold/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
} from '@shinefold/db/testing/personal-data';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { hasLength } from '@shinefold/utils/primitives';

import { createLead } from './create-lead';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

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
  if (!row || hasLength(others)) throw new Error('Expected exactly one lead.');
  return row;
}

afterEach(async () => {
  await db().delete(schema.leads);
});

describe(createLead, () => {
  it('stores an unread lead and returns only its id', async () => {
    const created = await createLead({ tenantId: tenant().id, ...MOCK_LEAD });

    const row = await readOnlyLead();
    const { id, sourcePath, readAt } = row;
    expect(created).toEqual({ id });
    expect({ sourcePath, readAt }).toEqual({
      sourcePath: MOCK_LEAD.sourcePath,
      readAt: null,
    });
    expect(row.tenantId).toBe(tenant().id);
  });

  describe('with a stored lead', () => {
    beforeEach(async () => {
      await createLead({ tenantId: tenant().id, ...MOCK_LEAD });
    });

    it('encrypts the name, email and message and indexes the email', async () => {
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

    it('is removed when its tenant is deleted', async () => {
      await db().delete(schema.tenants);

      expect(await db().select().from(schema.leads)).toEqual([]);
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
    await createLead({ tenantId: tenant().id, ...MOCK_LEAD, ...source });

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
});
