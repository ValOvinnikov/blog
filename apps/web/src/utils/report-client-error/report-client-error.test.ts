/**
 * @vitest-environment jsdom
 */
import { HTTP_METHOD } from '@blog/config';
import { faker } from '@faker-js/faker';

import { reportClientError } from './report-client-error';

faker.seed(6012);

const MOCK_EVENT = `${faker.lorem.word()}.${faker.lorem.word()}`;
const MOCK_OTHER_EVENT = `${faker.lorem.word()}.${faker.lorem.word()}`;
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_OTHER_MESSAGE = faker.lorem.sentence();
const MOCK_DIGEST = faker.string.alphanumeric(8);
const MOCK_PATHNAME = `/${faker.lorem.slug(2)}`;
const MOCK_QUERY = `?${faker.lorem.word()}=${faker.lorem.word()}`;
const MOCK_BURST_SIZE = 50;

const CLIENT_LOG_ENDPOINT = '/api/client-log';

const originalPathname = window.location.pathname;

const setPathname = (pathname: string) => {
  window.history.replaceState(null, '', pathname);
};

describe(reportClientError, () => {
  let report: typeof reportClientError;
  let sendBeacon: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sendBeacon = vi.fn().mockReturnValue(true);
    fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
    });
    setPathname(MOCK_PATHNAME);
    vi.resetModules();
    ({ reportClientError: report } = await import('./report-client-error'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'sendBeacon');
    setPathname(originalPathname);
  });

  describe('with sendBeacon available', () => {
    it('sends a beacon with the event, message and query-free url', async () => {
      setPathname(`${MOCK_PATHNAME}${MOCK_QUERY}`);

      report(MOCK_EVENT, new Error(MOCK_MESSAGE));

      const [[endpoint, blob]] = sendBeacon.mock.calls as [[string, Blob]];
      const { event, message, url } = JSON.parse(await blob.text());

      expect(sendBeacon).toHaveBeenCalledTimes(1);
      expect(endpoint).toBe(CLIENT_LOG_ENDPOINT);
      expect(event).toBe(MOCK_EVENT);
      expect(message).toBe(MOCK_MESSAGE);
      expect(url).toBe(MOCK_PATHNAME);
    });

    it('reports a repeated failure only once per page load', () => {
      report(MOCK_EVENT, new Error(MOCK_MESSAGE));
      report(MOCK_EVENT, new Error(MOCK_MESSAGE));

      expect(sendBeacon).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        case: 'a different message',
        event: MOCK_EVENT,
        message: MOCK_OTHER_MESSAGE,
      },
      {
        case: 'a different event',
        event: MOCK_OTHER_EVENT,
        message: MOCK_MESSAGE,
      },
    ])('reports again for $case', ({ event, message }) => {
      report(MOCK_EVENT, new Error(MOCK_MESSAGE));
      report(event, new Error(message));

      expect(sendBeacon).toHaveBeenCalledTimes(2);
    });

    it('stops sending once too many distinct failures were reported', () => {
      for (let index = 0; index < MOCK_BURST_SIZE; index += 1) {
        report(MOCK_EVENT, new Error(`${MOCK_MESSAGE} ${index}`));
      }
      const sentDuringBurst = sendBeacon.mock.calls.length;

      report(MOCK_EVENT, new Error(`${MOCK_MESSAGE} ${MOCK_BURST_SIZE}`));

      expect(sentDuringBurst).toBeLessThan(MOCK_BURST_SIZE);
      expect(sendBeacon).toHaveBeenCalledTimes(sentDuringBurst);
    });

    it('includes the digest when one is passed', async () => {
      report(MOCK_EVENT, new Error(MOCK_MESSAGE), { digest: MOCK_DIGEST });

      const [[, blob]] = sendBeacon.mock.calls as [[string, Blob]];
      const { digest } = JSON.parse(await blob.text());

      expect(digest).toBe(MOCK_DIGEST);
    });
  });

  it('falls back to fetch when the beacon queue is full', () => {
    sendBeacon.mockReturnValue(false);

    report(MOCK_EVENT, new Error(MOCK_MESSAGE));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe('without sendBeacon', () => {
    beforeEach(() => {
      Reflect.deleteProperty(navigator, 'sendBeacon');
    });

    it('posts the report with fetch and keepalive', () => {
      report(MOCK_EVENT, new Error(MOCK_MESSAGE));

      const [[endpoint, init]] = fetchMock.mock.calls as [
        [string, RequestInit],
      ];
      const { method, keepalive } = init;

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(endpoint).toBe(CLIENT_LOG_ENDPOINT);
      expect(method).toBe(HTTP_METHOD.POST);
      expect(keepalive).toBe(true);
    });

    it('never throws when fetch is unavailable too', () => {
      vi.stubGlobal('fetch', undefined);

      expect(() => report(MOCK_EVENT, new Error(MOCK_MESSAGE))).not.toThrow();
    });
  });
});
