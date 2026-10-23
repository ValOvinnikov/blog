import { BRAND_VARIANT, MEDIA_ORDER } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_HIGHLIGHT_ITEMS,
  MOCK_FEATURE_HIGHLIGHTS_HEADING,
} from '@web/testing/modules/feature-highlights/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureHighlightsModule } from './feature-highlights-module';

const MODULE_ID = 'feature-highlights-1';

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

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_HIGHLIGHTS_HEADING }),
  ctaButtons: [],
  mediaOrder: MEDIA_ORDER.FIRST,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(FeatureHighlightsModule, {
  id: MODULE_ID,
});

describe(`<${FeatureHighlightsModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureHighlightsModuleMock.mockReset();
  });

  it('fetches the module by id with the tenant context', async () => {
    getFeatureHighlightsModuleMock.mockResolvedValue(
      okResult({ ...baseModule, highlights: [] }),
    );

    await setup();

    expect(getFeatureHighlightsModuleMock).toHaveBeenCalledWith(
      MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureHighlightsModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved highlight rows', async () => {
    getFeatureHighlightsModuleMock.mockResolvedValue(
      okResult({ ...baseModule, highlights: MOCK_FEATURE_HIGHLIGHT_ITEMS }),
    );

    await setup();

    MOCK_FEATURE_HIGHLIGHT_ITEMS.forEach((highlight) => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: highlight.heading,
      });
      expect(heading).toBeVisible();
    });
  });
});
