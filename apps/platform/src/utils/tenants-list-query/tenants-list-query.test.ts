import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import { MOCK_TENANT_SLUG } from '@platform/testing/tenants/fixtures';

import {
  ARCHIVED_PARAM_ON,
  DEFAULT_TENANTS_SORT,
  MAX_TENANT_SEARCH_LENGTH,
  parseTenantsListQuery,
} from './tenants-list-query';

const MOCK_INVALID_PARAM = 'NOT_A_SORT';

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
    { sort: MOCK_INVALID_PARAM, direction: SORT_DIRECTION.ASCENDING },
    { sort: TENANT_SORT_COLUMN.PLAN, direction: MOCK_INVALID_PARAM },
    { sort: TENANT_SORT_COLUMN.PLAN, direction: undefined },
  ])(
    'falls back to the default sort for $sort / $direction',
    ({ sort, direction }) => {
      const query = parseTenantsListQuery({ sort, direction });

      expect(query.sort).toEqual(DEFAULT_TENANTS_SORT);
    },
  );

  it('reads the first value of a repeated parameter', () => {
    const query = parseTenantsListQuery({
      archived: [ARCHIVED_PARAM_ON, ''],
      sort: [TENANT_SORT_COLUMN.PLAN, TENANT_SORT_COLUMN.NAME],
      direction: [SORT_DIRECTION.ASCENDING],
      q: [MOCK_TENANT_SLUG, MOCK_INVALID_PARAM],
    });

    expect(query).toEqual({
      shouldShowArchived: true,
      sort: {
        column: TENANT_SORT_COLUMN.PLAN,
        direction: SORT_DIRECTION.ASCENDING,
      },
      search: MOCK_TENANT_SLUG,
    });
  });

  it('caps an over-long search', () => {
    const query = parseTenantsListQuery({
      q: MOCK_TENANT_SLUG.repeat(MAX_TENANT_SEARCH_LENGTH),
    });

    expect(query.search).toHaveLength(MAX_TENANT_SEARCH_LENGTH);
  });
});
