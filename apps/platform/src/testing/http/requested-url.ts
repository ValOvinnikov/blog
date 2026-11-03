import type { Mock } from 'vitest';

export const requestedUrl = (fetchMock: Mock, callIndex: number): URL =>
  fetchMock.mock.calls[callIndex]?.[0] as URL;
