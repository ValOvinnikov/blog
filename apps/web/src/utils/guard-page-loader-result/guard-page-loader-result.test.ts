import { notFound } from 'next/navigation';

import { guardPageLoaderResult } from './guard-page-loader-result';

const { loggerErrorMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe(guardPageLoaderResult.name, () => {
  beforeEach(() => {
    loggerErrorMock.mockClear();
  });

  it('returns the narrowed data when the result is ok and data is present', () => {
    const data = guardPageLoaderResult(
      { ok: true, data: { title: 'Hello' } },
      'some_page.fetch_failed',
    );

    expect(data).toEqual({ title: 'Hello' });
    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('logs the given event name and context, then calls notFound(), on a failed result', () => {
    const error = new Error('boom');

    expect(() =>
      guardPageLoaderResult({ ok: false, error }, 'tag_page.fetch_failed', {
        slug: 'engineering',
      }),
    ).toThrow('NEXT_NOT_FOUND');

    expect(loggerErrorMock).toHaveBeenCalledWith('tag_page.fetch_failed', {
      slug: 'engineering',
      error,
    });
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() without logging when the result is ok but data is undefined', () => {
    expect(() =>
      guardPageLoaderResult(
        { ok: true, data: undefined },
        'tag_page.fetch_failed',
        { slug: 'missing' },
      ),
    ).toThrow('NEXT_NOT_FOUND');

    expect(loggerErrorMock).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
