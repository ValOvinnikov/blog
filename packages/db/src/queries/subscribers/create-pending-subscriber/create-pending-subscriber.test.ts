import { SUBSCRIBER_OUTCOME, ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { errorResult, okResult } from '@blog/utils';

import { createPendingSubscriber } from './create-pending-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

async function readSubscribers(): Promise<schema.TSubscriber[]> {
  return db().select().from(schema.subscribers);
}

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(createPendingSubscriber, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores a fresh email as a pending row with its encrypted and index forms', async () => {
    const result = await createPendingSubscriber(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    const [row, ...others] = await readSubscribers();
    expect(others).toEqual([]);
    expect(result).toEqual(
      okResult({
        outcome: SUBSCRIBER_OUTCOME.CREATED,
        subscriber: { id: row?.id, email: MOCK_SUBSCRIBER_EMAIL },
      }),
    );
    expect(row?.status).toBe('pending');
    expect(row?.emailIndex).toBe(testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL));
    expect(decryptTestPersonalValue(row?.emailEncrypted ?? null)).toBe(
      MOCK_SUBSCRIBER_EMAIL,
    );
  });

  it.each([
    ['the same address', MOCK_SUBSCRIBER_EMAIL],
    ['a re-cased, padded address', `  ${MOCK_SUBSCRIBER_EMAIL.toUpperCase()} `],
    ['a +tag address', MOCK_SUBSCRIBER_TAGGED_EMAIL],
  ])('finds the pending row again for %s', async (_case, email) => {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    const result = await createPendingSubscriber(tenantId, email);

    expect(result).toEqual(
      okResult({
        outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING,
        subscriber: { id, email: MOCK_SUBSCRIBER_EMAIL },
      }),
    );
    expect(await readSubscribers()).toHaveLength(1);
  });

  it('reports an already-confirmed email as active without a new row', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
      { status: 'active' },
    );

    const result = await createPendingSubscriber(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toEqual(
      okResult({
        outcome: SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
        subscriber: { id, email: MOCK_SUBSCRIBER_EMAIL },
      }),
    );
    expect(await readSubscribers()).toHaveLength(1);
  });

  it('creates a separate row for the same email on another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, MOCK_SUBSCRIBER_EMAIL);

    const result = await createPendingSubscriber(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result.ok && result.data.outcome).toBe(SUBSCRIBER_OUTCOME.CREATED);
    expect(await readSubscribers()).toHaveLength(2);
  });

  it('settles two simultaneous signups for a new email on one row', async () => {
    const results = await Promise.all([
      createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
      createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
    ]);

    const [row, ...others] = await readSubscribers();
    expect(others).toEqual([]);
    const subscriber = { id: row?.id, email: MOCK_SUBSCRIBER_EMAIL };
    const settled = results
      .flatMap((result) => (result.ok ? [result.data] : []))
      .sort((a, b) => a.outcome.localeCompare(b.outcome));
    expect(settled).toEqual([
      { outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING, subscriber },
      { outcome: SUBSCRIBER_OUTCOME.CREATED, subscriber },
    ]);
  });

  it('returns not-found when the conflicting row vanishes before it is read', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
    const noRows = {
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>;
    const selectSpy = vi
      .spyOn(db(), 'select')
      .mockReturnValueOnce(noRows)
      .mockReturnValueOnce(noRows);

    const result = await createPendingSubscriber(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
    selectSpy.mockRestore();
  });
});
