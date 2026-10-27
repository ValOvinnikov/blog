import { faker } from '@faker-js/faker';

import { toCsv } from './to-csv';

faker.seed(6029);

const BOM = '﻿';
const MOCK_HEADING = faker.lorem.word();
const MOCK_CELL = faker.lorem.word();
const MOCK_COUNT = faker.number.int();

describe(toCsv, () => {
  it('joins cells with commas and rows with CRLF after a byte-order mark', () => {
    const csv = toCsv([[MOCK_HEADING], [MOCK_CELL, MOCK_COUNT]]);

    expect(csv).toBe(`${BOM}${MOCK_HEADING}\r\n${MOCK_CELL},${MOCK_COUNT}\r\n`);
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
