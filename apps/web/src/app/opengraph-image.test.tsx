export {};

const { resolveDefaultSocialImagePropsMock, buildDefaultSocialImageMock } =
  vi.hoisted(() => ({
    resolveDefaultSocialImagePropsMock: vi.fn(),
    buildDefaultSocialImageMock: vi.fn(),
  }));

vi.mock('@web/metadata/default-social-image/default-social-image', () => ({
  resolveDefaultSocialImageProps: resolveDefaultSocialImagePropsMock,
  buildDefaultSocialImage: buildDefaultSocialImageMock,
  contentType: 'image/png',
  size: { width: 1200, height: 630 },
}));

describe('opengraph-image', () => {
  beforeEach(() => {
    resolveDefaultSocialImagePropsMock.mockReset();
    buildDefaultSocialImageMock.mockReset();
  });

  it('resolves props for this route and renders the image from them', async () => {
    resolveDefaultSocialImagePropsMock.mockResolvedValue({
      brandName: 'Test Brand',
      tagline: 'Building things',
    });
    const { default: Image } = await import('./opengraph-image');

    await Image();

    expect(resolveDefaultSocialImagePropsMock).toHaveBeenCalledWith(
      'opengraph-image',
    );
    expect(buildDefaultSocialImageMock).toHaveBeenCalledWith({
      brandName: 'Test Brand',
      tagline: 'Building things',
    });
  });
});
