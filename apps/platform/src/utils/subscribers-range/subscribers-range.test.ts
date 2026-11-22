import { SUBSCRIBERS_PAGE_SIZE } from '@platform/constants/subscribers';
import {
  MOCK_SUBSCRIBER,
  mockConfirmedSubscriber,
} from '@platform/testing/subscribers/fixtures';

import { toSubscribersRange } from './subscribers-range';

const MOCK_TOTAL = SUBSCRIBERS_PAGE_SIZE + 2;

describe(toSubscribersRange, () => {
  it('counts the rows shown on a later page from where the earlier pages end', () => {
    const range = toSubscribersRange({
      list: {
        rows: [MOCK_SUBSCRIBER, mockConfirmedSubscriber()],
        total: MOCK_TOTAL,
      },
      page: 2,
    });

    expect(range).toEqual({
      from: SUBSCRIBERS_PAGE_SIZE + 1,
      to: MOCK_TOTAL,
      count: MOCK_TOTAL,
    });
  });
});
