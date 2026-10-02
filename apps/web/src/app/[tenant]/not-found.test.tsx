import TenantNotFound, { generateMetadata } from './not-found';

const { standaloneNotFoundPageMock, buildNotFoundMetadataMock, headersMock } =
  vi.hoisted(() => ({
    standaloneNotFoundPageMock: vi.fn(),
    buildNotFoundMetadataMock: vi.fn(),
    headersMock: vi.fn(),
  }));

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('next/headers', () => ({ headers: headersMock }));

describe('TenantNotFound ([tenant] not-found route)', () => {
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

    expect((await TenantNotFound()).props.children).toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith();
    expect(headersMock).not.toHaveBeenCalled();
  });
});
