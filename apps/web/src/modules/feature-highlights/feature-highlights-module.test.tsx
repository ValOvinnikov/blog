import { BRAND_VARIANT, MEDIA_ORDER } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_HIGHLIGHT_ITEMS,
  MOCK_FEATURE_HIGHLIGHTS_HEADING,
} from '@web/testing/modules/feature-highlights/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureHighlightsModule } from './feature-highlights-module';

faker.seed(6011);

const MOCK_MODULE_ID = faker.string.uuid();

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

const MOCK_BASE_MODULE = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_HIGHLIGHTS_HEADING }),
  ctaButtons: [],
  mediaOrder: MEDIA_ORDER.FIRST,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(FeatureHighlightsModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${FeatureHighlightsModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureHighlightsModuleMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getFeatureHighlightsModuleMock.mockResolvedValue(
        okResult({
          ...MOCK_BASE_MODULE,
          highlights: MOCK_FEATURE_HIGHLIGHT_ITEMS,
        }),
      );

      await setup();
    });

    it('fetches the module by id with the tenant context', () => {
      expect(getFeatureHighlightsModuleMock).toHaveBeenCalledWith(
        MOCK_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it.each(MOCK_FEATURE_HIGHLIGHT_ITEMS)(
      'renders the highlight row titled $heading',
      ({ heading }) => {
        const rowHeading = screen.getByRole('heading', {
          level: 3,
          name: heading,
        });

        expect(rowHeading).toBeVisible();
      },
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureHighlightsModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
