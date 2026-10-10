import type { PortableTextBlock } from '@portabletext/editor';

import { getListItemRun, isSameListItemRun } from './list-item-run';

const block = (
  key: string,
  listItem?: string,
  level?: number,
): PortableTextBlock => ({
  _type: 'block',
  _key: key,
  children: [],
  ...(listItem === undefined ? {} : { listItem, level }),
});

describe(getListItemRun, () => {
  it('places each item of an unbroken run by position and run size', () => {
    const value = [
      block('a', 'bullet'),
      block('b', 'bullet'),
      block('c', 'bullet'),
    ];

    expect(value.map((_, index) => getListItemRun(value, index))).toEqual([
      { position: 1, setSize: 3 },
      { position: 2, setSize: 3 },
      { position: 3, setSize: 3 },
    ]);
  });

  it('ends a run at a paragraph or a different list type', () => {
    const value = [
      block('a', 'bullet'),
      block('p'),
      block('b', 'bullet'),
      block('n', 'number'),
    ];

    expect(getListItemRun(value, 2)).toEqual({ position: 1, setSize: 1 });
    expect(getListItemRun(value, 3)).toEqual({ position: 1, setSize: 1 });
  });

  it('counts an outer run across a nested sub-list', () => {
    const value = [
      block('a', 'number', 1),
      block('x', 'bullet', 2),
      block('y', 'bullet', 2),
      block('b', 'number', 1),
    ];

    expect(getListItemRun(value, 3)).toEqual({ position: 2, setSize: 2 });
    expect(getListItemRun(value, 2)).toEqual({ position: 2, setSize: 2 });
  });

  it('has no run for a paragraph or an unknown index', () => {
    const value = [block('p'), block('a', 'bullet')];

    expect(getListItemRun(value, 0)).toBeUndefined();
    expect(getListItemRun(value, undefined)).toBeUndefined();
    expect(getListItemRun(value, 5)).toBeUndefined();
  });
});

describe(isSameListItemRun, () => {
  it('treats runs with the same position and size as equal', () => {
    expect(
      isSameListItemRun(
        { position: 2, setSize: 3 },
        { position: 2, setSize: 3 },
      ),
    ).toBe(true);
    expect(isSameListItemRun(undefined, undefined)).toBe(true);
  });

  it('treats a moved position, a resized run or a lost run as a change', () => {
    const run = { position: 2, setSize: 3 };

    expect(isSameListItemRun(run, { position: 1, setSize: 3 })).toBe(false);
    expect(isSameListItemRun(run, { position: 2, setSize: 4 })).toBe(false);
    expect(isSameListItemRun(run, undefined)).toBe(false);
  });
});
