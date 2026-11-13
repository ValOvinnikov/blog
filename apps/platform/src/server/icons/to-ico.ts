export type TIcoImage = {
  side: number;
  png: Uint8Array;
};

const HEADER_BYTES = 6;
const ENTRY_BYTES = 16;
const ICO_TYPE = 1;
const COLOR_PLANES = 1;
const BITS_PER_PIXEL = 32;

// An ICO entry stores 256px as 0 in its one-byte width and height.
const toEntrySide = (side: number): number => side % 256;

export const toIco = (
  images: readonly TIcoImage[],
): Uint8Array<ArrayBuffer> => {
  const dataStart = HEADER_BYTES + ENTRY_BYTES * images.length;
  const totalBytes = images.reduce(
    (total, { png }) => total + png.byteLength,
    dataStart,
  );
  const ico = new Uint8Array(totalBytes);
  const view = new DataView(ico.buffer);

  view.setUint16(2, ICO_TYPE, true);
  view.setUint16(4, images.length, true);

  images.reduce((offset, { side, png }, index) => {
    const entry = HEADER_BYTES + ENTRY_BYTES * index;
    view.setUint8(entry, toEntrySide(side));
    view.setUint8(entry + 1, toEntrySide(side));
    view.setUint16(entry + 4, COLOR_PLANES, true);
    view.setUint16(entry + 6, BITS_PER_PIXEL, true);
    view.setUint32(entry + 8, png.byteLength, true);
    view.setUint32(entry + 12, offset, true);
    ico.set(png, offset);
    return offset + png.byteLength;
  }, dataStart);

  return ico;
};
