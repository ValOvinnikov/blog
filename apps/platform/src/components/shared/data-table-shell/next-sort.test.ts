import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';

import { nextSort } from './next-sort';

const NAME_ASCENDING = {
  column: TENANT_SORT_COLUMN.NAME,
  direction: SORT_DIRECTION.ASCENDING,
};

describe(nextSort, () => {
  it('sorts a different column ascending', () => {
    const sort = nextSort(NAME_ASCENDING, TENANT_SORT_COLUMN.PLAN);

    expect(sort).toEqual({
      column: TENANT_SORT_COLUMN.PLAN,
      direction: SORT_DIRECTION.ASCENDING,
    });
  });

  it('reverses the sorted column each time it is chosen again', () => {
    const descending = nextSort(NAME_ASCENDING, TENANT_SORT_COLUMN.NAME);
    const ascending = nextSort(descending, TENANT_SORT_COLUMN.NAME);

    expect(descending.direction).toBe(SORT_DIRECTION.DESCENDING);
    expect(ascending.direction).toBe(SORT_DIRECTION.ASCENDING);
  });
});
