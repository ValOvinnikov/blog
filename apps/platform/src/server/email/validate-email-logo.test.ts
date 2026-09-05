import { MAX_EMAIL_LOGO_BYTES } from '@platform/utils/email-logo-limits/email-logo-limits';

import { validateEmailLogoUpload } from './validate-email-logo';

/** A minimal, CRC-less PNG — `image-size` only reads the IHDR chunk's fixed byte offsets, never validates checksums or decodes pixel data. */
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
  return new File([new Uint8Array(padded)], 'upload.png', {
    type: 'image/png',
  });
};

const buildGifBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(10);
  buffer.write('GIF89a', 0, 'latin1');
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);
  return buffer;
};

const gifFile = (width: number, height: number) => {
  return new File(
    [new Uint8Array(buildGifBuffer(width, height))],
    'upload.gif',
    {
      type: 'image/gif',
    },
  );
};

/** A minimal lossy (VP8) WebP — real header/chunk bytes so `image-size` classifies it as `webp`, which is all this validator needs to reject it. */
const buildWebpBuffer = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'latin1');
  buffer.write('WEBP', 8, 'latin1');
  buffer.write('VP8 ', 12, 'latin1');
  buffer.writeInt16LE(width, 26);
  buffer.writeInt16LE(height, 28);
  return buffer;
};

const webpFile = (width: number, height: number) => {
  return new File(
    [new Uint8Array(buildWebpBuffer(width, height))],
    'upload.webp',
    { type: 'image/webp' },
  );
};

const svgFile = (markup: string) => {
  return new File([markup], 'upload.svg', { type: 'image/svg+xml' });
};

describe(validateEmailLogoUpload, () => {
  it('accepts a PNG within the size ceiling', async () => {
    const result = await validateEmailLogoUpload(pngFile(200, 100));

    expect(result).toEqual({
      ok: true,
      asset: {
        buffer: expect.any(Buffer),
        contentType: 'image/png',
        extension: 'png',
      },
    });
  });

  it('accepts a GIF within the size ceiling', async () => {
    const result = await validateEmailLogoUpload(gifFile(200, 100));

    expect(result).toEqual({
      ok: true,
      asset: {
        buffer: expect.any(Buffer),
        contentType: 'image/gif',
        extension: 'gif',
      },
    });
  });

  it('accepts a JPEG-sized PNG stand-in within the dimension ceiling', async () => {
    const result = await validateEmailLogoUpload(pngFile(400, 400));

    expect(result.ok).toBe(true);
  });

  // Regression test: the site-logo validator (`validateBrandAssetUpload`)
  // accepts and sanitises SVG. This one must not — a future "unify the two
  // validators" refactor should fail this test, not silently start
  // accepting SVG email logos that render as nothing in Gmail/Outlook/Yahoo.
  it('rejects an SVG even though it is well-formed and safe', async () => {
    const result = await validateEmailLogoUpload(
      svgFile(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"></svg>',
      ),
    );

    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/svg/i),
    });
  });

  it('rejects a WebP image', async () => {
    const result = await validateEmailLogoUpload(webpFile(200, 100));

    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/webp/i),
    });
  });

  it('rejects a file over the byte ceiling', async () => {
    const result = await validateEmailLogoUpload(
      pngFile(100, 100, MAX_EMAIL_LOGO_BYTES),
    );

    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/too large/i),
    });
  });

  it('rejects an image over the dimension ceiling', async () => {
    const result = await validateEmailLogoUpload(pngFile(500, 200));

    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/400×400/),
    });
  });

  it('rejects an empty file', async () => {
    const result = await validateEmailLogoUpload(
      new File([], 'empty.png', { type: 'image/png' }),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Choose a file to upload.',
    });
  });

  it('rejects an unreadable file', async () => {
    const result = await validateEmailLogoUpload(
      new File([new Uint8Array([1, 2, 3, 4])], 'upload.bin', {
        type: 'application/octet-stream',
      }),
    );

    expect(result.ok).toBe(false);
  });
});
