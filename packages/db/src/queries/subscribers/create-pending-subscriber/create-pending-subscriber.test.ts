import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createPendingSubscriber } from './create-pending-subscriber';

const READER_EMAIL = 'reader@example.com';
const ALREADY_PENDING = 'already-pending';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
      await createPendingSubscriber(tenantId, READER_EMAIL),
    );

    expect(result.outcome).toBe('created');
    expect(result.subscriber).toMatchObject({
      tenantId,
      email: READER_EMAIL,
      status: 'pending',
    });
    expect(result.subscriber.confirmationTokenHash).toEqual(expect.any(String));
    expect(result.subscriber.unsubscribeTokenHash).toEqual(expect.any(String));
    expect(result.subscriber.confirmedAt).toBeNull();
    expect(result.subscriber.confirmationSentAt).toBeNull();

    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('normalizes email casing/whitespace so it collides with an existing row', async () => {
    const first = unwrapOk(
      await createPendingSubscriber(tenantId, 'Reader@Example.com'),
    );

    const second = unwrapOk(
      await createPendingSubscriber(tenantId, `  ${READER_EMAIL}  `),
    );

    expect(second.outcome).toBe(ALREADY_PENDING);
    expect(second.subscriber.id).toBe(first.subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent-safe for a duplicate submission while still pending', async () => {
    const first = unwrapOk(
      await createPendingSubscriber(tenantId, READER_EMAIL),
    );

    const second = await createPendingSubscriber(tenantId, READER_EMAIL);

    expect(second).toEqual({
      ok: true,
      data: { outcome: ALREADY_PENDING, subscriber: first.subscriber },
    });
    expect(unwrapOk(second).subscriber.confirmationTokenHash).toBe(
      first.subscriber.confirmationTokenHash,
    );
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('reports already-active for an email that already confirmed, without inserting or erroring', async () => {
    await db().insert(schema.subscribers).values({
      tenantId,
      email: READER_EMAIL,
      status: 'active',
      confirmedAt: new Date(),
    });

    const result = unwrapOk(
      await createPendingSubscriber(tenantId, READER_EMAIL),
    );

    expect(result.outcome).toBe('already-active');
    expect(result.subscriber.status).toBe('active');
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('allows the same email to subscribe on two different tenants', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());

    const first = unwrapOk(
      await createPendingSubscriber(tenantOneId, READER_EMAIL),
    );
    const second = unwrapOk(
      await createPendingSubscriber(tenantTwoId, READER_EMAIL),
    );

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('created');
    expect(first.subscriber.id).not.toBe(second.subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(2);
  });

  it('resolves two concurrent calls for the same brand-new email without an uncaught constraint error', async () => {
    const [first, second] = await Promise.all([
      createPendingSubscriber(tenantId, READER_EMAIL),
      createPendingSubscriber(tenantId, READER_EMAIL),
    ]);

    const outcomes = [unwrapOk(first).outcome, unwrapOk(second).outcome].sort();
    expect(outcomes).toEqual([ALREADY_PENDING, 'created']);
    expect(unwrapOk(first).subscriber.id).toBe(unwrapOk(second).subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    await createPendingSubscriber(tenantId, READER_EMAIL);

    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await createPendingSubscriber(tenantId, READER_EMAIL);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});
