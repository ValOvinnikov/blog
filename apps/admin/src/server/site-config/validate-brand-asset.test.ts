import { MAX_UPLOAD_BYTES } from '@admin/utils/brand-asset-limits/brand-asset-limits';

import { validateBrandAssetUpload } from './validate-brand-asset';

/** A minimal, CRC-less PNG — `image-size` only reads the IHDR chunk's fixed byte offsets, never validates checksums or decodes pixel data. */
function buildPngBuffer(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(33);
  buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8; // bit depth
  buffer[25] = 6; // color type (RGBA)
  return buffer;
}

function pngFile(width: number, height: number, sizeOverrideBytes?: number) {
  const bytes = buildPngBuffer(width, height);
  const padded = sizeOverrideBytes
    ? Buffer.concat([bytes, Buffer.alloc(sizeOverrideBytes)])
    : bytes;
  return new File([new Uint8Array(padded)], 'upload.png', {
    type: 'image/png',
  });
}

describe(validateBrandAssetUpload, () => {
  it('accepts a square PNG for the favicon', async () => {
    const result = await validateBrandAssetUpload(pngFile(64, 64), 'favicon');

    expect(result).toEqual({
      ok: true,
      asset: {
        buffer: expect.any(Buffer),
        contentType: 'image/png',
        extension: 'png',
      },
    });
  });

  it('accepts a non-square PNG for the logo', async () => {
    const result = await validateBrandAssetUpload(pngFile(300, 80), 'logo');

    expect(result.ok).toBe(true);
  });

  it('rejects a non-square favicon with a reason naming the actual dimensions', async () => {
    const result = await validateBrandAssetUpload(pngFile(64, 40), 'favicon');

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('64×40'),
    });
    if (!result.ok) {
      expect(result.error).toMatch(/square/i);
    }
  });

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({ ok: false, error: 'Choose a file to upload.' });
  });

  it('rejects a file over the size limit before reading its bytes', async () => {
    const file = pngFile(64, 64, MAX_UPLOAD_BYTES.favicon);

    const result = await validateBrandAssetUpload(file, 'favicon');

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('too large'),
    });
  });

  it("rejects a format it can read but doesn't allow (SVG), regardless of the declared MIME type", async () => {
    const svg = '<svg width="100" height="100"></svg>';
    const file = new File([svg], 'upload.svg', { type: 'image/svg+xml' });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: 'Choose a PNG, JPEG, or WebP image.',
    });
  });

  it('rejects unreadable bytes even when the declared MIME type claims to be an image', async () => {
    const file = new File(['not an image'], 'upload.png', {
      type: 'image/png',
    });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: "That file isn't a readable image.",
    });
  });

  it('rejects a logo below the minimum dimension bound', async () => {
    const result = await validateBrandAssetUpload(pngFile(8, 8), 'logo');

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('too small'),
    });
  });
});
