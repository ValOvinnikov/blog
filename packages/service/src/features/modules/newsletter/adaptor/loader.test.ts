import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';

import { getNewsletter } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getNewsletter', () => {
  it('maps the newsletter module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawNewsletterModule());

    const newsletter = await getNewsletter('newsletter-1');

    expect(newsletter.sectionHeader.heading).toBe('Stay in the loop');
    expect(newsletter.sectionHeader.supportingText).toBe(
      'Get new posts in your inbox.',
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getNewsletter('missing')).rejects.toThrow();
  });

  it('tags the query with the module and per-document tags', async () => {
    mockRun.mockResolvedValueOnce(makeRawNewsletterModule());

    await getNewsletter('newsletter-1');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: {
          revalidate: 3600,
          tags: ['modules:newsletter', 'module:newsletter-1'],
        },
      }),
    );
  });
});
