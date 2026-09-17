import NotFound, { generateMetadata } from './not-found';

const { standaloneNotFoundPageMock, buildNotFoundMetadataMock } = vi.hoisted(
  () => ({
    standaloneNotFoundPageMock: vi.fn(),
    buildNotFoundMetadataMock: vi.fn(),
  }),
);

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

describe('NotFound (root not-found route)', () => {
  describe('generateMetadata', () => {
    it('delegates to buildNotFoundMetadata', async () => {
      const metadata = { title: 'Page not found' };
      buildNotFoundMetadataMock.mockResolvedValue(metadata);

      await expect(generateMetadata()).resolves.toBe(metadata);
    });
  });

  it('renders StandaloneNotFoundPage with no tenant, never reading the request header', async () => {
    const ui = { type: 'div', props: {} };
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    await expect(NotFound()).resolves.toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith();
  });
});
