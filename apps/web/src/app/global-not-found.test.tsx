import NotFound, { generateMetadata } from './global-not-found';

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

describe('GlobalNotFound (unmatched-route 404)', () => {
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

    expect((await NotFound()).props.children).toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith();
  });
});
