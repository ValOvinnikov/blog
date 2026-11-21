import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import {
  MOCK_CROSS_SITE_STUDIO_REQUEST_HEADERS,
  studioJsonRequest,
} from '@platform/testing/newsletter-post-send/fixtures';
import { HTTP_STATUS } from '@shinefold/config';
import type { Mock } from 'vitest';

// The calling file mocks `@platform/server/auth/resolve-studio-caller`.
export const itRefusesCrossSiteStudioRequests = (
  post: (request: Request) => Promise<Response>,
  path: string,
  body: unknown,
  sendMock: Mock,
): void => {
  it.each(Object.entries(MOCK_CROSS_SITE_STUDIO_REQUEST_HEADERS))(
    'answers FORBIDDEN, before resolving the caller, to a request from %s',
    async (_case, headers) => {
      const response = await post(studioJsonRequest(path, body, headers));

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(resolveStudioCaller).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    },
  );
};
