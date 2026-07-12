import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawCtaModule } from '#/testing/modules/fixtures';

import { getCta } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
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
