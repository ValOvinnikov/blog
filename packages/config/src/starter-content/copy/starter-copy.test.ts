import { STARTER_COPY_BY_LOCALE } from './starter-copy';

type TCopyNode = string | readonly TCopyNode[] | { [key: string]: TCopyNode };

function shapeOf(node: TCopyNode): unknown {
  if (typeof node === 'string') return 'string';
  if (Array.isArray(node)) return node.map(shapeOf);
  return Object.fromEntries(
    Object.entries(node)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, shapeOf(value)]),
  );
}

function stringsOf(node: TCopyNode): string[] {
  if (typeof node === 'string') return [node];
  return (Array.isArray(node) ? node : Object.values(node)).flatMap(stringsOf);
}

const { EN, ...translations } = STARTER_COPY_BY_LOCALE;

describe('starter copy', () => {
  it.each(Object.entries(translations))(
    '%s has exactly the keys and paragraph count of EN',
    (_locale, copy) => {
      expect(shapeOf(copy)).toEqual(shapeOf(EN));
    },
  );

  it.each(Object.entries(STARTER_COPY_BY_LOCALE))(
    '%s has no blank string',
    (_locale, copy) => {
      expect(stringsOf(copy).filter((text) => !text.trim())).toEqual([]);
    },
  );
});
