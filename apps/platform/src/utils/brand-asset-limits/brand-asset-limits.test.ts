import { faker } from '@faker-js/faker';

import {
  ACCEPTED_IMAGE_MIME_TYPES,
  brandAssetKindSchema,
  MAX_UPLOAD_BYTES,
  quickClientImageCheck,
} from './brand-asset-limits';

faker.seed(6006);

const { logo, favicon } = brandAssetKindSchema.enum;

const MOCK_FILE_NAME = faker.system.fileName();
const MOCK_SMALL_BYTES = 1024;
const MOCK_UNSUPPORTED_MIME_TYPE = 'image/gif';

const mockFile = (type: string, sizeBytes: number): File =>
  new File([new Uint8Array(sizeBytes)], MOCK_FILE_NAME, { type });

describe(quickClientImageCheck, () => {
  it.each(ACCEPTED_IMAGE_MIME_TYPES)(
    'accepts a %s file within the logo size limit',
    (mimeType) => {
      const file = mockFile(mimeType, MOCK_SMALL_BYTES);

      expect(quickClientImageCheck(file, logo)).toBeUndefined();
    },
  );

  it('rejects an unsupported MIME type', () => {
    const file = mockFile(MOCK_UNSUPPORTED_MIME_TYPE, MOCK_SMALL_BYTES);

    expect(quickClientImageCheck(file, logo)).toEqual({
      key: 'unsupportedType',
    });
  });

  it.each([
    [logo, '4.0 MB'],
    [favicon, '1.0 MB'],
  ] as const)('rejects a %s file over its own size limit', (kind, limit) => {
    const file = mockFile(
      ACCEPTED_IMAGE_MIME_TYPES[0],
      MAX_UPLOAD_BYTES[kind] + 1,
    );

    expect(quickClientImageCheck(file, kind)).toEqual({
      key: 'tooLarge',
      limit,
    });
  });
});
