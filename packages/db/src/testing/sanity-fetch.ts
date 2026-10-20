export const SANITY_ACCESS_API_BASE = 'https://api.sanity.io/v2026-07-10';
export const SANITY_WEBHOOKS_API_BASE = 'https://api.sanity.io/v2025-08-04';

export const SANITY_TEST_TOKEN = 'tok';
export const SANITY_TEST_PROJECT_ID = 'proj123';

export function withSanityProject<T extends object>(extra: T) {
  return {
    token: SANITY_TEST_TOKEN,
    projectId: SANITY_TEST_PROJECT_ID,
    ...extra,
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

export function textResponse(body: string, status: number) {
  return new Response(body, { status });
}

export function emptyResponse(status = 200) {
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

export function firstFetchCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  const body =
    typeof init.body === 'string'
      ? (JSON.parse(init.body) as unknown)
      : undefined;
  return { url, init, body, headers: init.headers as Record<string, string> };
}
