import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawGenericPage } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPage', () => {
  it('maps the thin page_generic document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawGenericPage());

    const page = await getPage('about');

    expect(page.title).toBe('About');
    expect(page.slug).toBe('about');
    expect(page.modules).toEqual([
      { id: 'content-1', type: 'module_content' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
    expect(page.seo).toBeUndefined();
  });

  it('propagates when the page document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPage('missing')).rejects.toThrow();
  });
});
