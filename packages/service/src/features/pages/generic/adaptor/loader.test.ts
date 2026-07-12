import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawGenericPage } from '#/testing/pages/fixtures';

import { getPage } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPage', () => {
  it('maps the thin page_generic document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawGenericPage());

    const page = await getPage('about');

    expect(page.title).toBe('About');
    expect(page.slug).toBe('about');
    expect(page.modules).toEqual([
      { key: 'module-1', id: 'content-1', type: 'module_content' },
      { key: 'module-2', id: 'cta-1', type: 'module_cta' },
    ]);
    expect(page.seo).toBeUndefined();
  });

  it('propagates when the page document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPage('missing')).rejects.toThrow();
  });
});
