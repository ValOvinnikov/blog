import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';

import { getCta } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCta', () => {
  it('maps the cta module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawCtaModule());

    const cta = await getCta('cta-1');

    expect(cta.heading).toBe('Subscribe to the newsletter');
    expect(cta.action?.href).toBe('/newsletter');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getCta('missing')).rejects.toThrow();
  });
});
