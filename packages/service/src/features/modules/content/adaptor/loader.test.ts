import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawContentModule } from '#/testing/modules/fixtures';

import { getContent } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getContent', () => {
  it('maps the content module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawContentModule({ title: 'About us' }));

    const content = await getContent('content-1');

    expect(content.title).toBe('About us');
    expect(content.body).toHaveLength(1);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getContent('missing')).rejects.toThrow();
  });
});
