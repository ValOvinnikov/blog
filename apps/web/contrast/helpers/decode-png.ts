import { inflateSync } from 'node:zlib';

export type TPixels = { width: number; height: number; rgb: Uint8Array };

const PNG_SIGNATURE_LENGTH = 8;
const CHANNELS_BY_COLOR_TYPE: Record<number, number> = { 2: 3, 6: 4 };

const paeth = (left: number, up: number, upLeft: number): number => {
  const estimate = left + up - upLeft;
  const toLeft = Math.abs(estimate - left);
  const toUp = Math.abs(estimate - up);
  const toUpLeft = Math.abs(estimate - upLeft);
  if (toLeft <= toUp && toLeft <= toUpLeft) return left;
  return toUp <= toUpLeft ? up : upLeft;
};

const unfilterRow = (
  filter: number,
  row: Uint8Array,
  previous: Uint8Array,
  stride: number,
) => {
  for (let index = 0; index < row.length; index++) {
    const left = (index >= stride ? row[index - stride] : 0) ?? 0;
    const up = previous[index] ?? 0;
    const upLeft = (index >= stride ? previous[index - stride] : 0) ?? 0;
    const predictor =
      [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter] ?? 0;
    row[index] = ((row[index] ?? 0) + predictor) & 0xff;
  }
};

// Reads the 8-bit, non-interlaced RGB/RGBA PNGs Chromium's screenshots produce.
export const decodePng = (png: Buffer): TPixels => {
  let offset = PNG_SIGNATURE_LENGTH;
  let width = 0;
  let height = 0;
  let channels = 0;
  const compressed: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = CHANNELS_BY_COLOR_TYPE[data[9] ?? 0] ?? 0;
      if (data[8] !== 8 || channels === 0 || data[12] !== 0) {
        throw new Error('Unsupported PNG format');
      }
    }
    if (type === 'IDAT') compressed.push(data);
    offset += length + 12;
  }

  const raw = inflateSync(Buffer.concat(compressed));
  const stride = width * channels;
  const rgb = new Uint8Array(width * height * 3);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const row = Uint8Array.from(raw.subarray(start + 1, start + 1 + stride));
    unfilterRow(raw[start] ?? 0, row, previous, channels);
    for (let x = 0; x < width; x++) {
      rgb.set(
        row.subarray(x * channels, x * channels + 3),
        (y * width + x) * 3,
      );
    }
    previous = row;
  }
  return { width, height, rgb };
};
