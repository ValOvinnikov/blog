import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { LogoWallModule } from './logo-wall-module';

const { getLogoWallModuleMock, getTenantSanityContextMock } = vi.hoisted(
  () => ({
    getLogoWallModuleMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
  }),
);

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      logoWall: { v1: { getLogoWallModule: getLogoWallModuleMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

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
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${LogoWallModule.name}/>`, () => {
  beforeEach(() => {
    getLogoWallModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getLogoWallModule with the module id and the tenant Sanity context resolved from the tenant slug', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getLogoWallModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, logos: [] },
    });

    await setup();

    expect(getLogoWallModuleMock).toHaveBeenCalledWith('logo-wall-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when a logo image fails to resolve, since the loader throws rather than returning an empty tile', async () => {
    getLogoWallModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('Logo "Acme Corp"\'s image failed to resolve.'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the logos degrade to an empty list, never an empty landmark with a dangling aria-labelledby', async () => {
    getLogoWallModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, logos: [] },
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
      expect(screen.getByRole('img', { name: logo.name })).toBeInTheDocument();
    });
  });
});
