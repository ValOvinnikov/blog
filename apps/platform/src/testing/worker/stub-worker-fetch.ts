import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_WORKER_SECRET,
  MOCK_WORKER_URL,
} from '@platform/testing/worker/fixtures';
import { HTTP_STATUS } from '@shinefold/config';
import type { Mock } from 'vitest';

export type TWorkerFetchMock = Mock<
  (url: URL, init?: RequestInit) => Promise<Response>
>;

export const stubWorkerFetch = (fetchMock: TWorkerFetchMock): void => {
  fetchMock.mockImplementation(
    async () => new Response(null, { status: HTTP_STATUS.ACCEPTED }),
  );
  vi.stubGlobal('fetch', fetchMock);
  mockedEnv.WORKER_ENQUEUE_URL = MOCK_WORKER_URL;
  mockedEnv.WORKER_ENQUEUE_SECRET = MOCK_WORKER_SECRET;
};
