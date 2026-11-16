import { faker } from '@faker-js/faker';
import { errorResult, okResult } from '@shinefold/utils';
import { FEATURE_LIST_LOG } from '@web/constants/feature-list';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_LIST_ITEMS,
  mockFeatureListModule,
} from '@web/testing/modules/feature-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SECTION_STYLE_OVERRIDE_CASES } from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { FeatureListModule } from './feature-list-module';

faker.seed(6011);

const MOCK_MODULE_ID = faker.string.uuid();

const { getFeatureListMock } = vi.hoisted(() => ({
  getFeatureListMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@shinefold/service', () => ({
  service: {
    modules: {
      featureList: { v1: { getFeatureList: getFeatureListMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

const setup = customRenderAsync(FeatureListModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${FeatureListModule.name}/>`, () => {
  beforeEach(() => {
    getFeatureListMock.mockResolvedValue(okResult(mockFeatureListModule()));
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getFeatureListMock).toHaveBeenCalledWith(
        MOCK_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved feature cards', () => {
      const articles = screen.getAllByRole('article');

      expect(articles).toHaveLength(MOCK_FEATURE_LIST_ITEMS.length);
    });
  });

  it.each(MOCK_SECTION_STYLE_OVERRIDE_CASES)(
    'scopes the section to $title',
    async ({ overrides }) => {
      getFeatureListMock.mockResolvedValue(
        okResult(mockFeatureListModule(overrides)),
      );

      await setup();

      expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
        overrides,
      );
    },
  );

  it('logs and renders nothing when the fetch fails', async () => {
    getFeatureListMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      FEATURE_LIST_LOG.MODULE_FETCH_FAILED,
      { id: MOCK_MODULE_ID, error: MOCK_ERROR },
    );
  });
});
