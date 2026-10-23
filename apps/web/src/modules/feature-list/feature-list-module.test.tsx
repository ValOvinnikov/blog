import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_LIST_HEADING,
  MOCK_FEATURE_LIST_ITEMS,
} from '@web/testing/modules/feature-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FeatureListModule } from './feature-list-module';

const MODULE_ID = 'feature-list-1';

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

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_FEATURE_LIST_HEADING }),
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
};

const setup = customRenderAsync(FeatureListModule, {
  id: MODULE_ID,
});

describe(`<${FeatureListModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureListMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getFeatureListMock.mockResolvedValue(
        okResult({ ...baseModule, items: MOCK_FEATURE_LIST_ITEMS }),
      );

      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getFeatureListMock).toHaveBeenCalledWith(
        MODULE_ID,
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved feature cards', () => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getFeatureListMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
