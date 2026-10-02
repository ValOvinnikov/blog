import TenantNotFound, { generateMetadata } from './not-found';

const {
  standaloneNotFoundPageMock,
  buildNotFoundMetadataMock,
  peekContextTenantIdMock,
  headersMock,
} = vi.hoisted(() => ({
  standaloneNotFoundPageMock: vi.fn(),
  buildNotFoundMetadataMock: vi.fn(),
  peekContextTenantIdMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/request-context/request-context', () => ({
  peekContextTenantId: peekContextTenantIdMock,
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

  it('renders StandaloneNotFoundPage with the tenant the layout entered', async () => {
    const ui = { type: 'div', props: {} };
    peekContextTenantIdMock.mockReturnValue('tenant-1');
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    expect((await TenantNotFound()).props.children).toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: 'tenant-1',
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  it('renders StandaloneNotFoundPage with no tenant when no route entered one, without reading headers', async () => {
    const ui = { type: 'div', props: {} };
    peekContextTenantIdMock.mockReturnValue(undefined);
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    expect((await TenantNotFound()).props.children).toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: undefined,
    });
    expect(headersMock).not.toHaveBeenCalled();
  });
});
