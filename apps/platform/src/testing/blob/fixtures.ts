import { faker } from '@faker-js/faker';
import type { PutBlobResult } from '@vercel/blob';

export const MOCK_BLOB_TOKEN = 'test-token';

export const mockPutBlobResult = (
  overrides: Partial<PutBlobResult> = {},
): PutBlobResult => {
  const url = faker.internet.url();

  return {
    url,
    downloadUrl: url,
    pathname: faker.system.filePath(),
    contentType: faker.system.mimeType(),
    contentDisposition: faker.lorem.word(),
    etag: faker.string.uuid(),
    ...overrides,
  };
};
