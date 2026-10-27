import { faker } from '@faker-js/faker';
import {
  BULLET_LIST_ITEM,
  mockTextBlock,
  NUMBER_LIST_ITEM,
} from '@platform/testing/portable-text-editor/fixtures';

import { getListItemRun, isSameListItemRun } from './list-item-run';

faker.seed(5995);

describe(getListItemRun, () => {
  it('places each item of an unbroken run by position and run size', () => {
    const value = [
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
    ];

    const runs = value.map((_, index) => getListItemRun(value, index));

    expect(runs).toEqual([
      { position: 1, setSize: 3 },
      { position: 2, setSize: 3 },
      { position: 3, setSize: 3 },
    ]);
  });

  it.each([
    { index: 2, case: 'a paragraph' },
    { index: 3, case: 'a different list type' },
  ])('ends a run at $case', ({ index }) => {
    const value = [
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
      mockTextBlock(),
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
      mockTextBlock({ listItem: NUMBER_LIST_ITEM }),
    ];

    const run = getListItemRun(value, index);

    expect(run).toEqual({ position: 1, setSize: 1 });
  });

  it.each([
    { index: 3, case: 'the outer item after it' },
    { index: 2, case: 'the second nested item' },
  ])('counts a run across a nested sub-list for $case', ({ index }) => {
    const value = [
      mockTextBlock({ listItem: NUMBER_LIST_ITEM, level: 1 }),
      mockTextBlock({ listItem: BULLET_LIST_ITEM, level: 2 }),
      mockTextBlock({ listItem: BULLET_LIST_ITEM, level: 2 }),
      mockTextBlock({ listItem: NUMBER_LIST_ITEM, level: 1 }),
    ];

    const run = getListItemRun(value, index);

    expect(run).toEqual({ position: 2, setSize: 2 });
  });

  it.each([
    { index: 0, case: 'a block outside any list' },
    { index: undefined, case: 'no index' },
    { index: 5, case: 'an index past the end' },
  ])('has no run for $case', ({ index }) => {
    const value = [
      mockTextBlock(),
      mockTextBlock({ listItem: BULLET_LIST_ITEM }),
    ];

    const run = getListItemRun(value, index);

    expect(run).toBeUndefined();
  });
});

describe(isSameListItemRun, () => {
  const RUN = { position: 2, setSize: 3 };

  it.each([
    { case: 'the same run', current: RUN, next: { ...RUN }, expected: true },
    {
      case: 'no run on either side',
      current: undefined,
      next: undefined,
      expected: true,
    },
    {
      case: 'a moved position',
      current: RUN,
      next: { ...RUN, position: 1 },
      expected: false,
    },
    {
      case: 'a resized run',
      current: RUN,
      next: { ...RUN, setSize: 4 },
      expected: false,
    },
    { case: 'a lost run', current: RUN, next: undefined, expected: false },
  ])('reports $case as same: $expected', ({ current, next, expected }) => {
    const isSame = isSameListItemRun(current, next);

    expect(isSame).toBe(expected);
  });
});
