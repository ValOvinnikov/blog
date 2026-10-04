import { BRAND_VARIANT, MEDIA_ORDER } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureHighlightsModule } from './feature-highlights-module';

const { getFeatureHighlightsModuleMock } = vi.hoisted(() => ({
  getFeatureHighlightsModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      featureHighlights: {
        v1: { getFeatureHighlightsModule: getFeatureHighlightsModuleMock },
      },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Why choose us' }),
  ctaButtons: [],
  mediaOrder: MEDIA_ORDER.FIRST,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(FeatureHighlightsModule, {
  id: 'feature-highlights-1',
});

describe(`<${FeatureHighlightsModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureHighlightsModuleMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getFeatureHighlightsModule with the module id and tenant context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getFeatureHighlightsModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, highlights: [] },
    });

    await setup();

    expect(getFeatureHighlightsModuleMock).toHaveBeenCalledWith(
      'feature-highlights-1',
      tenant,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureHighlightsModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved highlight rows', async () => {
    const highlights = [
      makeFeatureHighlightItem({
        id: 'highlight-1',
        heading: 'Fast by default',
      }),
      makeFeatureHighlightItem({
        id: 'highlight-2',
        heading: 'Built for scale',
      }),
    ];
    getFeatureHighlightsModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, highlights },
    });

    await setup();

    highlights.forEach((highlight) => {
      expect(
        screen.getByRole('heading', { level: 3, name: highlight.heading }),
      ).toBeVisible();
    });
  });
});
