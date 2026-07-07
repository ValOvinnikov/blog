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
});
