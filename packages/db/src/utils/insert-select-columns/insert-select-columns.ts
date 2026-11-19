import { is, SQL, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export function columnDefault(column: PgColumn): SQL.Aliased {
  if (!is(column.default, SQL)) {
    throw new Error(`columnDefault: "${column.name}" has no SQL default.`);
  }

  return sql`${column.default}`.as(column.name);
}

export function castTo(column: PgColumn, value: SQL): SQL.Aliased {
  return sql`${value}::${sql.raw(column.getSQLType())}`.as(column.name);
}
