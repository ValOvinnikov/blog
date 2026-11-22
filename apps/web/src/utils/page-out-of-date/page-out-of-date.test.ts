import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_UNRECOGNIZED_ACTION_ERROR,
  mockUnrecognizedActionError,
} from '@web/testing/shared/out-of-date/mock-unrecognized-action';

import {
  subscribeToPageOutOfDate,
  unlessPageOutOfDate,
} from './page-out-of-date';

describe(unlessPageOutOfDate, () => {
  let onOutOfDate: () => void;
  let unsubscribe: () => void;

  beforeEach(() => {
    mockUnrecognizedActionError();
    onOutOfDate = vi.fn();
    unsubscribe = subscribeToPageOutOfDate(onOutOfDate);
  });

  afterEach(() => {
    unsubscribe();
  });

  it('passes a settled result through untouched', async () => {
    const result = await unlessPageOutOfDate(Promise.resolve(true));

    expect(result).toBe(true);
    expect(onOutOfDate).not.toHaveBeenCalled();
  });

  it('resolves to nothing and reports an unrecognised action', async () => {
    const result = await unlessPageOutOfDate(
      Promise.reject(MOCK_UNRECOGNIZED_ACTION_ERROR),
    );

    expect(result).toBeUndefined();
    expect(onOutOfDate).toHaveBeenCalledOnce();
  });

  it('rethrows any other rejection without reporting the page out of date', async () => {
    const request = unlessPageOutOfDate(Promise.reject(MOCK_ERROR));

    await expect(request).rejects.toBe(MOCK_ERROR);
    expect(onOutOfDate).not.toHaveBeenCalled();
  });

  it('stops reporting to a listener once it unsubscribes', async () => {
    unsubscribe();

    await unlessPageOutOfDate(Promise.reject(MOCK_UNRECOGNIZED_ACTION_ERROR));

    expect(onOutOfDate).not.toHaveBeenCalled();
  });
});
