export {};

describe('db client module loading', () => {
  const originalDatabaseUrl = process.env['DATABASE_URL'];

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }
    vi.resetModules();
  });

  it('does not connect to Neon while merely importing the module', async () => {
    delete process.env['DATABASE_URL'];
    vi.resetModules();

    await expect(import('./client')).resolves.toHaveProperty(
      'getDb',
      expect.any(Function),
    );
  });

  it('creates and caches a single drizzle instance across calls', async () => {
    process.env['DATABASE_URL'] = 'postgresql://user:pass@host/db';
    vi.resetModules();

    const { getDb } = await import('./client');

    expect(getDb()).toBe(getDb());
  });
});
