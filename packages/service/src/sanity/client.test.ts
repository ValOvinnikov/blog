import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Sanity client module loading', () => {
  const originalProjectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = originalProjectId;
    }
    vi.resetModules();
  });

  it('does not create a Sanity client while importing query helpers without a project id', async () => {
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    vi.resetModules();

    await expect(import('./query')).resolves.toHaveProperty('runQuery');
  });

  it('does not create a Sanity client while importing image helpers without a project id', async () => {
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    vi.resetModules();

    await expect(import('./image')).resolves.toHaveProperty('urlForImage');
  });

  it('creates the client with the Sanity CDN disabled', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getClient } = await import('./client');
    getClient();

    // Next's tagged data cache is the sole caching layer — a CDN read after a
    // tag purge can re-cache stale content (#316).
    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ useCdn: false }),
    );

    vi.doUnmock('next-sanity');
  });
});
