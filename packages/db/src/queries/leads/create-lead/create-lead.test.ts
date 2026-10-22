import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createLead } from './create-lead';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const LEAD = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to talk about a project.',
  sourcePath: '/en/contact',
};

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(createLead, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores the lead and returns it with an id and a creation time', async () => {
    const lead = await createLead({ tenantId, ...LEAD });

    expect(lead).toMatchObject({ tenantId, ...LEAD });
    expect(lead.id).toEqual(expect.any(String));
    expect(lead.createdAt).toBeInstanceOf(Date);
    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(1);
  });

  it('stores the name, email and message encrypted beside the plain values, with an email index', async () => {
    const lead = await createLead({ tenantId, ...LEAD });

    expect({
      name: decryptTestPersonalValue(lead.nameEncrypted),
      email: decryptTestPersonalValue(lead.emailEncrypted),
      message: decryptTestPersonalValue(lead.messageEncrypted),
    }).toEqual({ name: LEAD.name, email: LEAD.email, message: LEAD.message });
    expect(lead.emailIndex).toBe(testPersonalEmailIndex(LEAD.email));
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      createLead({ tenantId: '00000000-0000-0000-0000-000000000000', ...LEAD }),
    ).rejects.toThrow();
  });

  it('is removed when its tenant is deleted', async () => {
    await createLead({ tenantId, ...LEAD });

    await db().delete(schema.tenants);

    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(0);
  });
});
