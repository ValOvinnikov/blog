import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { buildImageUrl } from './build-image-url';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/abc123-800x600.jpg',
  ),
}));

const tenant = makeTenant();

describe('buildImageUrl', () => {
  it('returns undefined for null', () => {
    expect(buildImageUrl(null, tenant)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(buildImageUrl(undefined, tenant)).toBeUndefined();
  });

  it('returns undefined when image has no asset', () => {
    expect(
      buildImageUrl(
        {
          _type: 'imageWithAlt',
          asset: null,
          alt: 'x',
          hotspot: null,
          crop: null,
        },
        tenant,
      ),
    ).toBeUndefined();
  });

  it('returns a URL string for a valid image', () => {
    const result = buildImageUrl(makeRawImage(), tenant);
    expect(typeof result).toBe('string');
    expect(result).toContain('sanity.io');
  });

  it('returns undefined when urlForImage throws', async () => {
    const { urlForImage } = await import('@blog/service/sanity/image');
    vi.mocked(urlForImage).mockImplementationOnce(() => {
      throw new Error('builder error');
    });
    expect(buildImageUrl(makeRawImage(), tenant)).toBeUndefined();
  });

  it('forwards the tenant and transform options to urlForImage', async () => {
    const { urlForImage } = await import('@blog/service/sanity/image');
    const image = makeRawImage();

    buildImageUrl(image, tenant, { width: 64, height: 64, fit: 'crop' });

    expect(urlForImage).toHaveBeenCalledWith(image, tenant, {
      width: 64,
      height: 64,
      fit: 'crop',
    });
  });
});
