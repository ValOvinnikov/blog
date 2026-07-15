import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogIndexSettings } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getBlogIndexSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getBlogIndexSettings', () => {
  it('maps the raw page_blog singleton into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawBlogIndexSettings({
        heading: 'Latest posts',
        supportingText: 'Fresh from the team.',
        itemsPerPage: 12,
      }),
    );

    const result = await getBlogIndexSettings();

    expect(result).toEqual({
      heading: 'Latest posts',
      supportingText: 'Fresh from the team.',
      itemsPerPage: 12,
      seo: undefined,
    });
  });

  it('drops a null supportingText (no faked default)', async () => {
    mockRun.mockResolvedValue(
      makeRawBlogIndexSettings({ supportingText: null }),
    );

    const result = await getBlogIndexSettings();

    expect(result.supportingText).toBeUndefined();
  });

  it('falls back to "Blog" heading and POSTS_PER_PAGE when the singleton is unauthored', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getBlogIndexSettings();

    expect(result).toEqual({ heading: 'Blog', itemsPerPage: 9 });
  });
});
