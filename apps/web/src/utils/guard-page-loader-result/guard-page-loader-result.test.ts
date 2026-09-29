import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { guardPageLoaderResult } from './guard-page-loader-result';

vi.mock('@web/utils/logger/logger');

describe(guardPageLoaderResult.name, () => {
  it('returns the data when the result is ok and data is present', () => {
    const data = guardPageLoaderResult(
      { ok: true, data: { title: 'Hello' } },
      'some_page.fetch_failed',
    );

    expect(data).toEqual({ title: 'Hello' });
    expect(logger.error).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('logs the event and context, then calls notFound(), on a failure', () => {
    const error = new Error('boom');

    expect(() =>
      guardPageLoaderResult({ ok: false, error }, 'tag_page.fetch_failed', {
        slug: 'engineering',
      }),
    ).toThrow('NEXT_NOT_FOUND');

    expect(logger.error).toHaveBeenCalledWith('tag_page.fetch_failed', {
      slug: 'engineering',
      error,
    });
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() without logging when ok but data is undefined', () => {
    expect(() =>
      guardPageLoaderResult(
        { ok: true, data: undefined },
        'tag_page.fetch_failed',
        { slug: 'missing' },
      ),
    ).toThrow('NEXT_NOT_FOUND');

    expect(logger.error).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
