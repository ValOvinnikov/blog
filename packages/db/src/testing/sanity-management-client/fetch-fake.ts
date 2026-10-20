import {
  HTTP_METHOD,
  HTTP_STATUS,
  type THttpMethod,
  type THttpStatus,
} from '@blog/config';

export function jsonResponse(
  body: unknown,
  status: THttpStatus = HTTP_STATUS.OK,
) {
  return new Response(JSON.stringify(body), { status });
}

export function textResponse(body: string, status: THttpStatus) {
  return new Response(body, { status });
}

export function emptyResponse(status: THttpStatus = HTTP_STATUS.OK) {
  return new Response(null, { status });
}

export function useFetchFake() {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  return fetchMock;
}

export function nthFetchCall(
  fetchMock: ReturnType<typeof vi.fn>,
  index: number,
) {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  const body =
    typeof init.body === 'string'
      ? (JSON.parse(init.body) as unknown)
      : undefined;
  const method = (init.method ?? HTTP_METHOD.GET) as THttpMethod;
  return {
    url,
    init,
    method,
    body,
    headers: init.headers as Record<string, string>,
  };
}

export function firstFetchCall(fetchMock: ReturnType<typeof vi.fn>) {
  return nthFetchCall(fetchMock, 0);
}
