import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureListModule } from './feature-list-module';

const { getFeatureListMock } = vi.hoisted(() => ({
  getFeatureListMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      featureList: { v1: { getFeatureList: getFeatureListMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

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
});

describe(`<${FeatureListModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureListMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getFeatureList with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getFeatureListMock.mockResolvedValue({
      ok: true,
      data: {
        ...baseModule,
        items: [
          makeFeatureListItem({ id: 'feature-1' }),
          makeFeatureListItem({ id: 'feature-2' }),
        ],
      },
    });

    await setup();

    expect(getFeatureListMock).toHaveBeenCalledWith('feature-list-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureListMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
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
