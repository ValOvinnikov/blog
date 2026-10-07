import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPublishedPostBody } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPublishedPostBody, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue({ body: [] });
  });

  it('returns the post body from the raw query result', async () => {
    const body = [{ _type: 'block', _key: 'b1', children: [] }];
    mockRun.mockResolvedValueOnce({ body });

    const result = await getPublishedPostBody('post-1', tenant);

    expect(result).toEqual(body);
  });

  it('queries by the given post id', async () => {
    await getPublishedPostBody('post-abc', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { id: 'post-abc' } }),
    );
  });

  it('does not tag the fetch for Next ISR caching (always reads fresh)', async () => {
    await getPublishedPostBody('post-abc', tenant);

    const [, options] = mockRun.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(options).not.toHaveProperty('next');
  });

  it('propagates when no published post matches the id', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPublishedPostBody('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery', async () => {
    await getPublishedPostBody('post-abc', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenant }),
    );
  });
});
