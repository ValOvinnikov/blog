/**
 * @vitest-environment jsdom
 */
export {};

const originalPathname = window.location.pathname;

const freshModule = async () => {
  vi.resetModules();
  return import('./report-client-error');
};

const setPathname = (pathname: string) => {
  window.history.replaceState(null, '', pathname);
};

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

  describe('with sendBeacon available', () => {
    let reportClientError: typeof import('./report-client-error').reportClientError;

    beforeEach(async () => {
      ({ reportClientError } = await freshModule());
    });

    it('sends a beacon with the event, message, and stripped-of-query url', async () => {
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

    it('deduplicates by event+message fingerprint within the same page load', async () => {
      reportClientError('copy_to_clipboard.write_failed', new Error('denied'));
      reportClientError('copy_to_clipboard.write_failed', new Error('denied'));

      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });

    it('reports again for the same event with a different message', async () => {
      reportClientError('copy_to_clipboard.write_failed', new Error('denied'));
      reportClientError('copy_to_clipboard.write_failed', new Error('other'));

      expect(sendBeacon).toHaveBeenCalledTimes(2);
    });

    it('hard-stops the number of sends once further distinct-fingerprint reports stop increasing it', async () => {
      const REPORT_CEILING = 100;
      let previousCallCount = -1;
      let i = 0;
      for (
        ;
        i < REPORT_CEILING &&
        sendBeacon.mock.calls.length !== previousCallCount;
        i += 1
      ) {
        previousCallCount = sendBeacon.mock.calls.length;
        reportClientError('copy_to_clipboard.write_failed', new Error(`e${i}`));
      }
      if (i >= REPORT_CEILING) {
        throw new Error(
          `reportClientError did not stop sending within ${REPORT_CEILING} reports`,
        );
      }

      expect(sendBeacon.mock.calls.length).toBe(previousCallCount);

      reportClientError('copy_to_clipboard.write_failed', new Error(`e${i}`));
      expect(sendBeacon.mock.calls.length).toBe(previousCallCount);
    });

    it('includes the digest when passed through extra', async () => {
      reportClientError('error_boundary.render_failed', new Error('boom'), {
        digest: 'abc123',
      });

      const [, blob] = sendBeacon.mock.calls[0] as [string, Blob];
      const body = JSON.parse(await blob.text());
      expect(body.digest).toBe('abc123');
    });
  });

  it('falls back to fetch when sendBeacon returns false (queue full)', async () => {
    sendBeacon.mockReturnValue(false);
    const { reportClientError } = await freshModule();

    reportClientError('bookmark_button.status_fetch_failed', new Error('x'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe('without sendBeacon', () => {
    beforeEach(() => {
      Reflect.deleteProperty(navigator, 'sendBeacon');
    });

    it('falls back to fetch with keepalive when sendBeacon is unavailable', async () => {
      const { reportClientError } = await freshModule();

      reportClientError('bookmark_button.status_fetch_failed', new Error('x'));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(endpoint).toBe('/api/client-log');
      expect(init.method).toBe('POST');
      expect(init.keepalive).toBe(true);
    });

    it('never throws when both sendBeacon and fetch are unavailable', async () => {
      vi.unstubAllGlobals();
      vi.stubGlobal('fetch', undefined);
      const { reportClientError } = await freshModule();

      expect(() =>
        reportClientError('copy_to_clipboard.write_failed', new Error('x')),
      ).not.toThrow();
    });
  });
});
