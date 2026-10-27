import { MOCK_DATABASE_URL } from '@blog/db/testing/env/fixtures';

describe('db client module loading', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('does not connect to Neon while merely importing the module', async () => {
    vi.stubEnv('DATABASE_URL', undefined);

    await expect(import('./client')).resolves.toHaveProperty('getDb');
  });

  it('creates and caches a single drizzle instance across calls', async () => {
    vi.stubEnv('DATABASE_URL', MOCK_DATABASE_URL);

    const { getDb } = await import('./client');

    expect(getDb()).toBe(getDb());
  });
});
