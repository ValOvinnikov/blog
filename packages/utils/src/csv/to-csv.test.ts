import { toCsv } from './to-csv';

const BOM = '﻿';

describe(toCsv, () => {
  it('joins cells with commas and rows with CRLF after a byte-order mark', () => {
    expect(
      toCsv([
        ['kind', 'count'],
        ['LEAD', 2],
      ]),
    ).toBe(`${BOM}kind,count\r\nLEAD,2\r\n`);
  });

  it('quotes a cell holding a comma, a quote or a line break', () => {
    expect(toCsv([['a, b', 'say "hi"', 'one\ntwo']])).toBe(
      `${BOM}"a, b","say ""hi""","one\ntwo"\r\n`,
    );
  });

  it('leaves a missing value empty', () => {
    expect(toCsv([[undefined, null, false]])).toBe(`${BOM},,false\r\n`);
  });

  it('keeps a spreadsheet from reading text as a formula', () => {
    expect(toCsv([['=SUM(A1)', '@cmd', '+1', '-1']])).toBe(
      `${BOM}'=SUM(A1),'@cmd,'+1,'-1\r\n`,
    );
  });

  it('leaves a negative number as a number', () => {
    expect(toCsv([[-1]])).toBe(`${BOM}-1\r\n`);
  });
});
