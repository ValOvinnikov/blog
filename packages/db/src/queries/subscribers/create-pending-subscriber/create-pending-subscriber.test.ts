import { SUBSCRIBER_OUTCOME, ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createPendingSubscriber } from './create-pending-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

function unwrapOk<T>(result: { ok: boolean; data?: T; error?: unknown }): T {
  if (!result.ok) {
    throw new Error(`expected ok:true, got error "${String(result.error)}"`);
  }
  return result.data as T;
}

describe(createPendingSubscriber, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new pending row for a fresh email', async () => {
    const result = unwrapOk(
      await createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
    );

    expect(result.outcome).toBe(SUBSCRIBER_OUTCOME.CREATED);
    expect(result.subscriber).toMatchObject({
      tenantId,
      email: MOCK_SUBSCRIBER_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
      status: 'pending',
    });
    expect(decryptTestPersonalValue(result.subscriber.emailEncrypted)).toBe(
      MOCK_SUBSCRIBER_EMAIL,
    );
    expect(result.subscriber.confirmedAt).toBeNull();
    expect(result.subscriber.confirmationSentAt).toBeNull();

    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it.each([
    { variant: 'the same', email: MOCK_SUBSCRIBER_EMAIL },
    {
      variant: 'a differently cased, space-padded',
      email: `  ${MOCK_SUBSCRIBER_EMAIL.toUpperCase()}  `,
    },
  ])(
    'returns the pending row for $variant email instead of a duplicate',
    async ({ email }) => {
      const first = unwrapOk(
        await createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
      );

      const second = await createPendingSubscriber(tenantId, email);

      expect(second).toEqual({
        ok: true,
        data: {
          outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING,
          subscriber: first.subscriber,
        },
      });
      const rows = await db().select().from(schema.subscribers);
      expect(rows).toHaveLength(1);
    },
  );

  it('reports already-active for an email that already confirmed, without inserting or erroring', async () => {
    await db().insert(schema.subscribers).values({
      tenantId,
      email: MOCK_SUBSCRIBER_EMAIL,
      status: 'active',
      confirmedAt: new Date(),
    });

    const result = unwrapOk(
      await createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
    );

    expect(result.outcome).toBe(SUBSCRIBER_OUTCOME.ALREADY_ACTIVE);
    expect(result.subscriber.status).toBe('active');
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('allows the same email to subscribe on two different tenants', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());

    const first = unwrapOk(
      await createPendingSubscriber(tenantOneId, MOCK_SUBSCRIBER_EMAIL),
    );
    const second = unwrapOk(
      await createPendingSubscriber(tenantTwoId, MOCK_SUBSCRIBER_EMAIL),
    );

    expect(first.outcome).toBe(SUBSCRIBER_OUTCOME.CREATED);
    expect(second.outcome).toBe(SUBSCRIBER_OUTCOME.CREATED);
    expect(first.subscriber.id).not.toBe(second.subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(2);
  });

  it('resolves two concurrent calls for the same brand-new email without an uncaught constraint error', async () => {
    const [first, second] = await Promise.all([
      createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
      createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL),
    ]);

    const outcomes = [unwrapOk(first).outcome, unwrapOk(second).outcome].sort();
    expect(outcomes).toEqual([
      SUBSCRIBER_OUTCOME.ALREADY_PENDING,
      SUBSCRIBER_OUTCOME.CREATED,
    ]);
    expect(unwrapOk(first).subscriber.id).toBe(unwrapOk(second).subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    await createPendingSubscriber(tenantId, MOCK_SUBSCRIBER_EMAIL);

    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await createPendingSubscriber(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});
