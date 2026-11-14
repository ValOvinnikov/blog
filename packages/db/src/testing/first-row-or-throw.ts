export function firstRowOrThrow<TRow>(rows: TRow[], caller: string): TRow {
  const [row] = rows;
  if (!row) throw new Error(`${caller}: the query returned no row.`);

  return row;
}
