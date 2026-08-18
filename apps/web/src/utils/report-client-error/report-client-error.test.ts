export {};

const originalPathname = window.location.pathname;

async function freshModule() {
  vi.resetModules();
  return import('./report-client-error');
}

function setPathname(pathname: string) {
  window.history.replaceState(null, '', pathname);
}

describe('reportClientError', () => {
  let sendBeacon: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeacon = vi.fn().mockReturnValue(true);
    fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
    });
    setPathname('/blog/some-post');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'sendBeacon');
    setPathname(originalPathname);
  });

  it('sends a beacon with the event, message, and stripped-of-query url', async () => {
    const { reportClientError } = await freshModule();
    setPathname('/blog/some-post?utm_source=x');

    reportClientError('copy_to_clipboard.write_failed', new Error('denied'));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [endpoint, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(endpoint).toBe('/api/client-log');
    const body = JSON.parse(await blob.text());
    expect(body).toMatchObject({
      event: 'copy_to_clipboard.write_failed',
      message: 'denied',
      url: '/blog/some-post',
    });
  });

  it('falls back to fetch with keepalive when sendBeacon is unavailable', async () => {
    Reflect.deleteProperty(navigator, 'sendBeacon');
    const { reportClientError } = await freshModule();

    reportClientError('bookmark_button.status_fetch_failed', new Error('x'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe('/api/client-log');
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
  });

  it('falls back to fetch when sendBeacon returns false (queue full)', async () => {
    sendBeacon.mockReturnValue(false);
    const { reportClientError } = await freshModule();

    reportClientError('bookmark_button.status_fetch_failed', new Error('x'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates by event+message fingerprint within the same page load', async () => {
    const { reportClientError } = await freshModule();

    reportClientError('copy_to_clipboard.write_failed', new Error('denied'));
    reportClientError('copy_to_clipboard.write_failed', new Error('denied'));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('reports again for the same event with a different message', async () => {
    const { reportClientError } = await freshModule();

    reportClientError('copy_to_clipboard.write_failed', new Error('denied'));
    reportClientError('copy_to_clipboard.write_failed', new Error('other'));

    expect(sendBeacon).toHaveBeenCalledTimes(2);
  });

  it('hard-stops after the circuit breaker limit is reached', async () => {
    const { reportClientError } = await freshModule();

    for (let i = 0; i < 10; i += 1) {
      reportClientError('copy_to_clipboard.write_failed', new Error(`e${i}`));
    }

    expect(sendBeacon.mock.calls.length).toBeLessThan(10);
    expect(sendBeacon.mock.calls.length).toBeGreaterThan(0);
  });

  it('includes the digest when passed through extra', async () => {
    const { reportClientError } = await freshModule();

    reportClientError('error_boundary.render_failed', new Error('boom'), {
      digest: 'abc123',
    });

    const [, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    const body = JSON.parse(await blob.text());
    expect(body.digest).toBe('abc123');
  });

  it('never throws when both sendBeacon and fetch are unavailable', async () => {
    Reflect.deleteProperty(navigator, 'sendBeacon');
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', undefined);
    const { reportClientError } = await freshModule();

    expect(() =>
      reportClientError('copy_to_clipboard.write_failed', new Error('x')),
    ).not.toThrow();
  });
});
