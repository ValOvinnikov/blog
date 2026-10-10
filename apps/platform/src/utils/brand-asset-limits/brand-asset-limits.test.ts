import { MAX_UPLOAD_BYTES, quickClientImageCheck } from './brand-asset-limits';

const makeFile = (type: string, sizeBytes: number): File => {
  return new File([new Uint8Array(sizeBytes)], 'upload', { type });
};

describe(quickClientImageCheck, () => {
  it('accepts a PNG within the logo size limit', () => {
    const file = makeFile('image/png', 1024);

    expect(quickClientImageCheck(file, 'logo')).toBeUndefined();
  });

  it('accepts an SVG within the logo size limit', () => {
    const file = makeFile('image/svg+xml', 1024);

    expect(quickClientImageCheck(file, 'logo')).toBeUndefined();
  });

  it('rejects an unsupported MIME type', () => {
    const file = makeFile('image/gif', 1024);

    expect(quickClientImageCheck(file, 'logo')).toEqual({
      key: 'unsupportedType',
    });
  });

  it('rejects a logo file over the logo size limit', () => {
    const file = makeFile('image/png', MAX_UPLOAD_BYTES.logo + 1);

    expect(quickClientImageCheck(file, 'logo')).toEqual({
      key: 'tooLarge',
      limit: '4.0 MB',
    });
  });

  it("enforces the favicon's tighter size limit independently of the logo's", () => {
    const file = makeFile('image/png', MAX_UPLOAD_BYTES.favicon + 1);

    expect(quickClientImageCheck(file, 'favicon')).toEqual({
      key: 'tooLarge',
      limit: '1.0 MB',
    });
    expect(MAX_UPLOAD_BYTES.favicon).toBeLessThan(MAX_UPLOAD_BYTES.logo);
  });
});
