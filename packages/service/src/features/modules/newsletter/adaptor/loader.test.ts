import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getNewsletter } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getNewsletter', () => {
  it('maps the newsletter module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawNewsletterModule());

    const newsletter = await getNewsletter('newsletter-1', tenant);

    expect(newsletter.sectionHeader.heading).toBe('Stay in the loop');
    expect(newsletter.sectionHeader.supportingText).toBe(
      'Get new posts in your inbox.',
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getNewsletter('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawNewsletterModule());

    await getNewsletter('newsletter-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:newsletter',
            't:tenant-a:module:newsletter-1',
          ],
        }),
      }),
    );
  });
});
