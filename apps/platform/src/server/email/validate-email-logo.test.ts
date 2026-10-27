import { ACTION_OUTCOME } from '@blog/config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import {
  buildPngBuffer,
  MOCK_MIME_TYPE,
} from '@platform/testing/upload/fixtures';
import {
  EMAIL_LOGO_MAX_DIMENSION_PX,
  MAX_EMAIL_LOGO_BYTES,
  maxEmailLogoKbLabel,
} from '@platform/utils/email-logo-limits/email-logo-limits';

import { validateEmailLogoUpload } from './validate-email-logo';

const MOCK_WIDTH_PX = 200;
const MOCK_HEIGHT_PX = 100;
const MOCK_FILE_NAME = 'upload';
const MOCK_SVG_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"></svg>';
const MOCK_UNREADABLE_BYTES = new Uint8Array([1, 2, 3, 4]);
const BINARY_MIME = 'application/octet-stream';

const buildGifBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(10);
  buffer.write('GIF89a', 0, 'latin1');
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);
  return buffer;
};

const buildWebpBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'latin1');
  buffer.write('WEBP', 8, 'latin1');
  buffer.write('VP8 ', 12, 'latin1');
  buffer.writeInt16LE(width, 26);
  buffer.writeInt16LE(height, 28);
  return buffer;
};

const toFile = (bytes: Buffer, extension: string, type: string) =>
  new File([new Uint8Array(bytes)], `${MOCK_FILE_NAME}.${extension}`, {
    type,
  });

const pngBytes = (width: number, height: number, paddingBytes = 0) =>
  Buffer.concat([buildPngBuffer(width, height), Buffer.alloc(paddingBytes)]);

const refused = (reason: string, values?: Record<string, unknown>) => ({
  ok: false,
  error: { outcome: ACTION_OUTCOME.REFUSED, reason, ...(values && { values }) },
});

describe(validateEmailLogoUpload, () => {
  it.each([
    [
      'PNG',
      buildPngBuffer(MOCK_WIDTH_PX, MOCK_HEIGHT_PX),
      'png',
      MOCK_MIME_TYPE.PNG,
    ],
    [
      'GIF',
      buildGifBuffer(MOCK_WIDTH_PX, MOCK_HEIGHT_PX),
      'gif',
      MOCK_MIME_TYPE.GIF,
    ],
  ])(
    'accepts a %s within the limits',
    async (_format, bytes, extension, mime) => {
      const result = await validateEmailLogoUpload(
        toFile(bytes, extension, mime),
      );

      expect(result).toEqual({
        ok: true,
        data: { buffer: bytes, contentType: mime, extension },
      });
    },
  );

  it('accepts an image exactly at the dimension ceiling', async () => {
    const bytes = buildPngBuffer(
      EMAIL_LOGO_MAX_DIMENSION_PX,
      EMAIL_LOGO_MAX_DIMENSION_PX,
    );

    const result = await validateEmailLogoUpload(
      toFile(bytes, 'png', MOCK_MIME_TYPE.PNG),
    );

    expect(result).toEqual({
      ok: true,
      data: {
        buffer: bytes,
        contentType: MOCK_MIME_TYPE.PNG,
        extension: 'png',
      },
    });
  });

  it('rejects an SVG even though the site-logo validator accepts it', async () => {
    const result = await validateEmailLogoUpload(
      new File([MOCK_SVG_MARKUP], `${MOCK_FILE_NAME}.svg`, {
        type: MOCK_MIME_TYPE.SVG,
      }),
    );

    expect(result).toEqual(refused(UPLOAD_REFUSAL.EMAIL_LOGO_SVG));
  });

  it('rejects a WebP image', async () => {
    const result = await validateEmailLogoUpload(
      toFile(
        buildWebpBuffer(MOCK_WIDTH_PX, MOCK_HEIGHT_PX),
        'webp',
        MOCK_MIME_TYPE.WEBP,
      ),
    );

    expect(result).toEqual(refused(UPLOAD_REFUSAL.EMAIL_LOGO_WEBP));
  });

  it('rejects a file over the byte ceiling', async () => {
    const result = await validateEmailLogoUpload(
      toFile(
        pngBytes(MOCK_HEIGHT_PX, MOCK_HEIGHT_PX, MAX_EMAIL_LOGO_BYTES),
        'png',
        MOCK_MIME_TYPE.PNG,
      ),
    );

    expect(result).toEqual(
      refused(UPLOAD_REFUSAL.FILE_TOO_LARGE, { limit: maxEmailLogoKbLabel() }),
    );
  });

  it.each([
    [EMAIL_LOGO_MAX_DIMENSION_PX + 1, MOCK_HEIGHT_PX],
    [MOCK_HEIGHT_PX, EMAIL_LOGO_MAX_DIMENSION_PX + 1],
  ])(
    'rejects a %i by %i image over the dimension ceiling',
    async (width, height) => {
      const result = await validateEmailLogoUpload(
        toFile(buildPngBuffer(width, height), 'png', MOCK_MIME_TYPE.PNG),
      );

      expect(result).toEqual(
        refused(UPLOAD_REFUSAL.IMAGE_TOO_LARGE, {
          size: EMAIL_LOGO_MAX_DIMENSION_PX,
        }),
      );
    },
  );

  it('rejects an empty file', async () => {
    const result = await validateEmailLogoUpload(
      new File([], `${MOCK_FILE_NAME}.png`, { type: MOCK_MIME_TYPE.PNG }),
    );

    expect(result).toEqual(refused(UPLOAD_REFUSAL.FILE_MISSING));
  });

  it('rejects an unreadable file', async () => {
    const result = await validateEmailLogoUpload(
      new File([MOCK_UNREADABLE_BYTES], `${MOCK_FILE_NAME}.bin`, {
        type: BINARY_MIME,
      }),
    );

    expect(result).toEqual(refused(UPLOAD_REFUSAL.UNREADABLE_IMAGE));
  });
});
