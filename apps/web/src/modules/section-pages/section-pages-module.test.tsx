import { faker } from '@faker-js/faker';
import { errorResult, okResult } from '@shinefold/utils';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_SECTION_PAGE_PATH,
  MOCK_SECTION_PAGE_TITLE,
  mockSectionPagesModule,
} from '@web/testing/modules/section-pages/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SECTION_STYLE_OVERRIDE_CASES } from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SectionPagesModule } from './section-pages-module';

const { getSectionPagesModuleMock } = vi.hoisted(() => ({
  getSectionPagesModuleMock: vi.fn(),
}));

vi.mock('@shinefold/service', () => ({
  service: {
    modules: {
      sectionPages: {
        v1: { getSectionPagesModule: getSectionPagesModuleMock },
      },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

faker.seed(42);

const MOCK_SECTION_PAGES_ID = faker.string.uuid();
const MOCK_LANDING_PAGE = {
  id: faker.string.uuid(),
  path: faker.lorem.slug(),
};

const setup = customRenderAsync(SectionPagesModule, {
  id: MOCK_SECTION_PAGES_ID,
  context: { landingPage: MOCK_LANDING_PAGE },
});

describe(`<${SectionPagesModule.name}/>`, () => {
  beforeEach(() => {
    getSectionPagesModuleMock.mockReset();
    getSectionPagesModuleMock.mockResolvedValue(
      okResult(mockSectionPagesModule()),
    );
  });

  describe('with the landing page context', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module for the landing page it sits on', () => {
      expect(getSectionPagesModuleMock).toHaveBeenCalledWith(
        MOCK_SECTION_PAGES_ID,
        MOCK_LANDING_PAGE.id,
        MOCK_LANDING_PAGE.path,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders a card per section page linking to its full path', () => {
      const link = screen.getByRole('link', { name: MOCK_SECTION_PAGE_TITLE });

      expect(link).toHaveAttribute('href', `/${MOCK_SECTION_PAGE_PATH}`);
    });
  });

  it.each(MOCK_SECTION_STYLE_OVERRIDE_CASES)(
    'scopes the section to $title',
    async ({ overrides }) => {
      getSectionPagesModuleMock.mockResolvedValue(
        okResult(mockSectionPagesModule(overrides)),
      );

      await setup();

      expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
        overrides,
      );
    },
  );

  it('renders nothing when the page has no children', async () => {
    getSectionPagesModuleMock.mockResolvedValue(
      okResult(mockSectionPagesModule({ pages: [] })),
    );

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing and logs an error when the fetch fails', async () => {
    getSectionPagesModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('renders nothing and warns, without fetching, outside a landing page', async () => {
    const { container } = await setup({ context: undefined });

    expect(container).toBeEmptyDOMElement();
    expect(getSectionPagesModuleMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
