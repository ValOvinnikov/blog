import { makeRawNewsletterSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getNewsletterSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getNewsletterSettings', () => {
  it('returns undefined heading/description when the document does not exist (not yet configured, not an error)', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getNewsletterSettings();

    expect(result).toEqual({ heading: undefined, description: undefined });
  });

  it('maps raw newsletter settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawNewsletterSettings({
        heading: 'Join the newsletter',
        description: 'Weekly updates, no spam.',
      }),
    );

    const result = await getNewsletterSettings();

    expect(result.heading).toBe('Join the newsletter');
    expect(result.description).toBe('Weekly updates, no spam.');
  });

  it('leaves heading and description undefined when not set (no faked default)', async () => {
    mockRun.mockResolvedValue(
      makeRawNewsletterSettings({ heading: null, description: null }),
    );

    const result = await getNewsletterSettings();

    expect(result.heading).toBeUndefined();
    expect(result.description).toBeUndefined();
  });
});
