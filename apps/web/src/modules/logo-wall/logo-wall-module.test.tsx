import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { LogoWallModule } from './logo-wall-module';

const { getLogoWallModuleMock } = vi.hoisted(() => ({
  getLogoWallModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      logoWall: { v1: { getLogoWallModule: getLogoWallModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Trusted by' }),
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(LogoWallModule, {
  id: 'logo-wall-1',
});

describe(`<${LogoWallModule.name}/>`, () => {
  beforeEach(() => {
    getLogoWallModuleMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getLogoWallModule with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getLogoWallModuleMock.mockResolvedValue({
      ok: true,
      data: {
        ...baseModule,
        logos: [makeLogoItem({ id: 'logo-1', name: 'Acme Corp' })],
      },
    });

    await setup();

    expect(getLogoWallModuleMock).toHaveBeenCalledWith('logo-wall-1', tenant);
  });

  it('renders nothing when a logo image fails to resolve', async () => {
    getLogoWallModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('Logo "Acme Corp"\'s image failed to resolve.'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved logos', async () => {
    const logos = [
      makeLogoItem({ id: 'logo-1', name: 'Acme Corp' }),
      makeLogoItem({ id: 'logo-2', name: 'Nimbus Inc' }),
    ];
    getLogoWallModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, logos },
    });

    await setup();

    logos.forEach((logo) => {
      expect(screen.getByRole('img', { name: logo.name })).toBeVisible();
    });
  });
});
