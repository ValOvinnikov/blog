import { faker } from '@faker-js/faker';

import { toIco } from './to-ico';

faker.seed(7307);

const LARGEST_SIDE = 256;

const mockPng = () =>
  Uint8Array.from(
    faker.helpers.multiple(() => faker.number.int({ min: 0, max: 255 }), {
      count: faker.number.int({ min: 4, max: 12 }),
    }),
  );

const MOCK_IMAGES = [
  { side: 16, png: mockPng() },
  { side: 32, png: mockPng() },
];

const readEntry = (ico: Uint8Array, index: number) => {
  const view = new DataView(ico.buffer);
  const entry = 6 + 16 * index;

  return {
    side: view.getUint8(entry),
    size: view.getUint32(entry + 8, true),
    offset: view.getUint32(entry + 12, true),
  };
};

describe(toIco, () => {
  it('heads the file as an icon holding every image', () => {
    const view = new DataView(toIco(MOCK_IMAGES).buffer);

    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(MOCK_IMAGES.length);
  });

  it.each(MOCK_IMAGES.map((image, index) => ({ ...image, index })))(
    'stores the $side px image at the offset and size its entry names',
    ({ side, png, index }) => {
      const ico = toIco(MOCK_IMAGES);
      const { side: entrySide, size, offset } = readEntry(ico, index);

      expect(entrySide).toBe(side);
      expect(ico.slice(offset, offset + size)).toEqual(png);
    },
  );

  it('records a 256 px image as side 0', () => {
    const ico = toIco([{ side: LARGEST_SIDE, png: mockPng() }]);

    expect(readEntry(ico, 0).side).toBe(0);
  });
});
