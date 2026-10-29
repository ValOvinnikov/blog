import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import { MOCK_TENANT_SLUG } from '@platform/testing/tenants/fixtures';

import {
  ARCHIVED_PARAM_ON,
  DEFAULT_TENANTS_SORT,
  parseTenantsListQuery,
} from './tenants-list-query';

describe(parseTenantsListQuery, () => {
  it('reads an empty query as active tenants, newest first, unsearched', () => {
    const query = parseTenantsListQuery({});

    expect(query).toEqual({
      shouldShowArchived: false,
      sort: {
        column: TENANT_SORT_COLUMN.CREATED,
        direction: SORT_DIRECTION.DESCENDING,
      },
      search: '',
    });
  });

  it('reads the archived flag, sort and trimmed search', () => {
    const query = parseTenantsListQuery({
      archived: ARCHIVED_PARAM_ON,
      sort: TENANT_SORT_COLUMN.STATUS,
      direction: SORT_DIRECTION.ASCENDING,
      q: ` ${MOCK_TENANT_SLUG} `,
    });

    expect(query).toEqual({
      shouldShowArchived: true,
      sort: {
        column: TENANT_SORT_COLUMN.STATUS,
        direction: SORT_DIRECTION.ASCENDING,
      },
      search: MOCK_TENANT_SLUG,
    });
  });

  it.each([
    { sort: MOCK_TENANT_SLUG, direction: SORT_DIRECTION.ASCENDING },
    { sort: TENANT_SORT_COLUMN.PLAN, direction: MOCK_TENANT_SLUG },
    { sort: TENANT_SORT_COLUMN.PLAN, direction: undefined },
  ])(
    'falls back to the default sort for $sort / $direction',
    ({ sort, direction }) => {
      const query = parseTenantsListQuery({ sort, direction });

      expect(query.sort).toEqual(DEFAULT_TENANTS_SORT);
    },
  );
});
