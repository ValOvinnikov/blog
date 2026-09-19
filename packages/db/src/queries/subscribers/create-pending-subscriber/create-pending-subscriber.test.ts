import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createPendingSubscriber } from './create-pending-subscriber';

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
  it('inserts a new pending row for a fresh email', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = unwrapOk(
      await createPendingSubscriber(tenantId, 'reader@example.com'),
    );

    expect(result.outcome).toBe('created');
    expect(result.subscriber).toMatchObject({
      tenantId,
      email: 'reader@example.com',
      status: 'pending',
    });
    expect(result.subscriber.confirmationToken).toEqual(expect.any(String));
    expect(result.subscriber.unsubscribeToken).toEqual(expect.any(String));
    expect(result.subscriber.confirmedAt).toBeNull();

    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('normalizes email casing/whitespace so it collides with an existing row', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const first = unwrapOk(
      await createPendingSubscriber(tenantId, 'Reader@Example.com'),
    );

    const second = unwrapOk(
      await createPendingSubscriber(tenantId, '  reader@example.com  '),
    );

    expect(second.outcome).toBe('already-pending');
    expect(second.subscriber.id).toBe(first.subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent-safe for a duplicate submission while still pending', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const first = unwrapOk(
      await createPendingSubscriber(tenantId, 'reader@example.com'),
    );

    const second = await createPendingSubscriber(
      tenantId,
      'reader@example.com',
    );

    expect(second).toEqual({
      ok: true,
      data: { outcome: 'already-pending', subscriber: first.subscriber },
    });
    expect(unwrapOk(second).subscriber.confirmationToken).toBe(
      first.subscriber.confirmationToken,
    );
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('reports already-active for an email that already confirmed, without inserting or erroring', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db().insert(schema.subscribers).values({
      tenantId,
      email: 'reader@example.com',
      status: 'active',
      confirmedAt: new Date(),
    });

    const result = unwrapOk(
      await createPendingSubscriber(tenantId, 'reader@example.com'),
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
      await createPendingSubscriber(tenantOneId, 'reader@example.com'),
    );
    const second = unwrapOk(
      await createPendingSubscriber(tenantTwoId, 'reader@example.com'),
    );

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('created');
    expect(first.subscriber.id).not.toBe(second.subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(2);
  });

  it('resolves two concurrent calls for the same brand-new email without an uncaught constraint error', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const [first, second] = await Promise.all([
      createPendingSubscriber(tenantId, 'reader@example.com'),
      createPendingSubscriber(tenantId, 'reader@example.com'),
    ]);

    const outcomes = [unwrapOk(first).outcome, unwrapOk(second).outcome].sort();
    expect(outcomes).toEqual(['already-pending', 'created']);
    expect(unwrapOk(first).subscriber.id).toBe(unwrapOk(second).subscriber.id);
    const rows = await db().select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes before the follow-up read', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await createPendingSubscriber(tenantId, 'reader@example.com');

    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await createPendingSubscriber(
      tenantId,
      'reader@example.com',
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});
