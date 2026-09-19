import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureListModule } from './feature-list-module';

const { getFeatureListMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getFeatureListMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      featureList: { v1: { getFeatureList: getFeatureListMock } },
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
  headingBlock: makeHeadingBlock({ heading: 'Why choose us' }),
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
};

const setup = customRenderAsync(FeatureListModule, {
  id: 'feature-list-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${FeatureListModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureListMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getFeatureList with the module id and the tenant Sanity context resolved from the tenant slug', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getFeatureListMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, items: [] },
    });

    await setup();

    expect(getFeatureListMock).toHaveBeenCalledWith('feature-list-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureListMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the items degrade to an empty list, never an empty landmark with a dangling aria-labelledby', async () => {
    getFeatureListMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, items: [] },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders the resolved feature cards', async () => {
    const items = [
      makeFeatureListItem({ id: 'feature-1' }),
      makeFeatureListItem({ id: 'feature-2' }),
    ];
    getFeatureListMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, items },
    });

    await setup();

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
