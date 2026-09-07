import { makeRawNewsletterSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getNewsletterSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getNewsletterSettings', () => {
  it('throws when the newsletter settings document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getNewsletterSettings(tenant)).rejects.toThrow();
  });

  it('maps raw newsletter settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawNewsletterSettings({
        heading: 'Join the newsletter',
        description: 'Weekly updates, no spam.',
        trustCues: ['No spam', 'Unsubscribe anytime'],
      }),
    );

    const result = await getNewsletterSettings(tenant);

    expect(result.heading).toBe('Join the newsletter');
    expect(result.description).toBe('Weekly updates, no spam.');
    expect(result.trustCues).toEqual(['No spam', 'Unsubscribe anytime']);
  });

  it('leaves description undefined when not set (no faked default)', async () => {
    mockRun.mockResolvedValue(makeRawNewsletterSettings({ description: null }));

    const result = await getNewsletterSettings(tenant);

    expect(result.description).toBeUndefined();
  });

  it('leaves trustCues undefined when not set (no faked default)', async () => {
    mockRun.mockResolvedValue(makeRawNewsletterSettings({ trustCues: null }));

    const result = await getNewsletterSettings(tenant);

    expect(result.trustCues).toBeUndefined();
  });

  it('preserves an explicit empty trustCues array rather than treating it as absent', async () => {
    mockRun.mockResolvedValue(makeRawNewsletterSettings({ trustCues: [] }));

    const result = await getNewsletterSettings(tenant);

    expect(result.trustCues).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawNewsletterSettings());

    await getNewsletterSettings(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:newsletter-settings'],
        }),
      }),
    );
  });
});
