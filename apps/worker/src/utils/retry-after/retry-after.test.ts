import { isUndefined } from '@blog/utils/primitives';
import {
  RETRY_AFTER_HEADER,
  RETRY_AFTER_SECOND_MS,
} from '@worker/constants/retry-after';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';

import { readRetryAfter } from './retry-after';

const MOCK_RETRY_SECONDS = 120;
const MOCK_RETRY_DATE = new Date(
  MOCK_NOW.getTime() + MOCK_RETRY_SECONDS * RETRY_AFTER_SECOND_MS,
);

function responseRetryingAfter(value?: string): Response {
  return new Response(null, {
    headers: isUndefined(value) ? {} : { [RETRY_AFTER_HEADER]: value },
  });
}

describe(readRetryAfter, () => {
  beforeEach(() => {
    freezeClock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads a delay in seconds from now', () => {
    expect(
      readRetryAfter(responseRetryingAfter(String(MOCK_RETRY_SECONDS))),
    ).toEqual(MOCK_RETRY_DATE);
  });

  it('reads an HTTP date', () => {
    expect(
      readRetryAfter(responseRetryingAfter(MOCK_RETRY_DATE.toUTCString())),
    ).toEqual(MOCK_RETRY_DATE);
  });

  it.each([undefined, '', 'soon'])(
    'has no retry time for the header %j',
    (value) => {
      expect(readRetryAfter(responseRetryingAfter(value))).toBeUndefined();
    },
  );
});
