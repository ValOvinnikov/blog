vi.resetModules();

// The unstub and restore config flags run before each test, so without this the last test's stubs are still set while the next file's module scope evaluates.
afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
