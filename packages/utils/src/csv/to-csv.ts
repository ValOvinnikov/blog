export type TCsvCell = string | number | boolean | null | undefined;

// A spreadsheet runs a text cell starting with one of these as a formula.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;
const ROW_SEPARATOR = '\r\n';
// Without a byte-order mark Excel reads the file as ANSI and garbles non-ASCII text.
const UTF8_BOM = '﻿';

function toCsvCell(value: TCsvCell): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);

  const text = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: readonly (readonly TCsvCell[])[]): string {
  const lines = rows.map((row) => row.map(toCsvCell).join(','));
  return `${UTF8_BOM}${lines.join(ROW_SEPARATOR)}${ROW_SEPARATOR}`;
}
