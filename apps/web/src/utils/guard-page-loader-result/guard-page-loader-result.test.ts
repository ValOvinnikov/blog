import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { guardPageLoaderResult } from './guard-page-loader-result';

faker.seed(117);

const MOCK_LOG_EVENT = `${faker.lorem.word()}.${faker.lorem.word()}`;
const MOCK_DATA = { title: faker.lorem.words(2) };
const MOCK_CONTEXT = { slug: faker.lorem.slug() };
const MOCK_ERROR = new Error(faker.lorem.sentence());

describe(guardPageLoaderResult, () => {
  it('returns the data when the result is ok and data is present', () => {
    const data = guardPageLoaderResult(okResult(MOCK_DATA), MOCK_LOG_EVENT);

    expect(data).toEqual(MOCK_DATA);
    expect(logger.error).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('logs the event with its context, then responds not found, on a failure', () => {
    expect(() =>
      guardPageLoaderResult(
        errorResult(MOCK_ERROR),
        MOCK_LOG_EVENT,
        MOCK_CONTEXT,
      ),
    ).toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(logger.error).toHaveBeenCalledWith(MOCK_LOG_EVENT, {
      ...MOCK_CONTEXT,
      error: MOCK_ERROR,
    });
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('responds not found without logging when ok but no document matched', () => {
    expect(() =>
      guardPageLoaderResult(okResult(), MOCK_LOG_EVENT, MOCK_CONTEXT),
    ).toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(logger.error).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
