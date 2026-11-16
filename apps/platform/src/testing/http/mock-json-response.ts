import { HTTP_STATUS } from '@shinefold/config';

export const mockJsonResponse = (
  body: unknown,
  status: number = HTTP_STATUS.OK,
): Response => new Response(JSON.stringify(body), { status });
