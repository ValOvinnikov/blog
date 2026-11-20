import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@shinefold/utils/enqueue-signature';

type TFetchCalls = { mock: { calls: unknown[][] } };

export type TSentSignedRequest = {
  url: URL;
  method: RequestInit['method'];
  body: unknown;
  isSignedWith: (secret: string, path: string) => boolean;
};

export const readSentSignedRequest = (
  fetchMock: TFetchCalls,
  callIndex = 0,
): TSentSignedRequest => {
  const [url, init] = fetchMock.mock.calls[callIndex] as [URL, RequestInit];
  const headers = init.headers as Record<string, string>;
  const rawBody = init.body as string;

  return {
    url,
    method: init.method,
    body: JSON.parse(rawBody),
    isSignedWith: (secret, path) =>
      isValidEnqueueSignature({
        secret,
        timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
        signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
        path,
        rawBody,
      }),
  };
};
