import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import { ClientError } from '@sanity/client';

export const MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE =
  'transaction failed: Insufficient permissions; permission "create" required';
export const MOCK_MALFORMED_DOCUMENT_MESSAGE = 'malformed document';
export const MOCK_SANITY_MUTATE_URL =
  'https://api.sanity.io/v2024-01-01/data/mutate/production';

export function mockSanityGrantError(): ClientError {
  return new ClientError({
    statusCode: HTTP_STATUS.FORBIDDEN,
    headers: {},
    body: { message: 'Forbidden' },
    url: MOCK_SANITY_MUTATE_URL,
    method: HTTP_METHOD.POST,
  });
}
