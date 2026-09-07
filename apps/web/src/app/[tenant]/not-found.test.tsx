import TenantNotFound, { generateMetadata } from './not-found';

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

describe('TenantNotFound ([tenant] not-found route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('delegates to buildNotFoundMetadata', async () => {
      const metadata = { title: 'Page not found' };
      buildNotFoundMetadataMock.mockResolvedValue(metadata);

      await expect(generateMetadata()).resolves.toBe(metadata);
    });
  });

  it('renders StandaloneNotFoundPage, independent of the tenant layout', async () => {
    const ui = { type: 'div', props: {} };
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    await expect(TenantNotFound()).resolves.toBe(ui);
  });
});
