import { STARTER_COPY_BY_LOCALE } from './starter-copy';

function leavesOf(copy: object): unknown[] {
  const leaves: unknown[] = [];
  JSON.stringify(copy, (_key, value: unknown) => {
    if (!(value instanceof Object)) leaves.push(value);
    return value;
  });
  return leaves;
}

function shapeOf(copy: object): string {
  return JSON.stringify(copy, (_key, value: unknown) =>
    value instanceof Object ? value : null,
  );
}

const { EN, ...translations } = STARTER_COPY_BY_LOCALE;

describe('starter copy', () => {
  it.each(Object.entries(translations))(
    '%s has exactly the keys, in order, and paragraph count of EN',
    (_locale, copy) => {
      expect(shapeOf(copy)).toBe(shapeOf(EN));
    },
  );

  it.each(Object.entries(STARTER_COPY_BY_LOCALE))(
    '%s has no blank string',
    (_locale, copy) => {
      expect(leavesOf(copy).filter((leaf) => !String(leaf).trim())).toEqual([]);
    },
  );
});
