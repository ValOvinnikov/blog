import { getDb } from '@blog/db/client';
import { encryptPersonalData } from '@blog/utils/encryption';
import { isString } from '@blog/utils/primitives';
import { and, asc, gt, type SQL, sql } from 'drizzle-orm';

import type { TPersonalDataKeys } from './personal-data-keys';
import {
  fieldGap,
  type IPersonalDataField,
  type IPersonalDataTarget,
  targetGap,
} from './personal-data-targets';

const BATCH_SIZE = 500;

function fillMissing(
  { encrypted, emailIndex }: IPersonalDataField,
  value: string,
  { keyring, indexKey }: TPersonalDataKeys,
): SQL {
  const encryptedSet = sql`${sql.identifier(encrypted.name)} = coalesce(${encrypted}, ${encryptPersonalData(value, keyring)})`;
  if (!emailIndex) return encryptedSet;

  const { column, indexer } = emailIndex;
  return sql`${encryptedSet}, ${sql.identifier(column.name)} = coalesce(${column}, ${indexer(value, indexKey)})`;
}

async function backfillRow(
  { table, id, fields }: IPersonalDataTarget,
  row: Record<string, unknown>,
  keys: TPersonalDataKeys,
): Promise<void> {
  const db = getDb();

  for (const field of fields) {
    const value = row[field.plain.name];
    if (!isString(value) || value === '') continue;

    await db.execute(
      sql`update ${table} set ${fillMissing(field, value, keys)} where ${id} = ${row[id.name]} and ${field.plain} = ${value} and ${fieldGap(field)}`,
    );
  }
}

export async function backfillTarget(
  target: IPersonalDataTarget,
  keys: TPersonalDataKeys,
): Promise<number> {
  const db = getDb();
  const { table, id, fields } = target;
  const selection = Object.fromEntries([
    [id.name, id],
    ...fields.map(({ plain }) => [plain.name, plain]),
  ]);

  let backfilled = 0;
  let afterId: unknown;

  for (;;) {
    const batch = await db
      .select(selection)
      .from(table)
      .where(
        afterId === undefined
          ? targetGap(target)
          : and(targetGap(target), gt(id, afterId)),
      )
      .orderBy(asc(id))
      .limit(BATCH_SIZE);

    for (const row of batch) {
      await backfillRow(target, row, keys);
    }

    backfilled += batch.length;
    if (batch.length < BATCH_SIZE) return backfilled;
    afterId = batch.at(-1)?.[id.name];
  }
}
