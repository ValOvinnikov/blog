import { errorResult, okResult } from '@blog/utils';
import { TESTIMONIAL_LOG } from '@web/constants/testimonial';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TESTIMONIAL_ITEMS,
  MOCK_TESTIMONIAL_MODULE_ID,
  mockTestimonialModule,
} from '@web/testing/modules/testimonial/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { TestimonialModule } from './testimonial-module';

const { getTestimonialModuleMock } = vi.hoisted(() => ({
  getTestimonialModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      testimonial: { v1: { getTestimonialModule: getTestimonialModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

const setup = customRenderAsync(TestimonialModule, {
  id: MOCK_TESTIMONIAL_MODULE_ID,
});

describe(`<${TestimonialModule.name}/>`, () => {
  beforeEach(() => {
    getTestimonialModuleMock.mockResolvedValue(
      okResult(mockTestimonialModule()),
    );
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getTestimonialModuleMock).toHaveBeenCalledWith(
        MOCK_TESTIMONIAL_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved testimonials', () => {
      const quotes = screen.getAllByRole('blockquote');

      expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
    });
  });

  it.each([
    {
      title: "the module's style overrides",
      overrides: MOCK_SECTION_STYLE_OVERRIDES,
    },
    { title: 'no overrides', overrides: MOCK_NO_SECTION_STYLE_OVERRIDES },
  ])('scopes the section to $title', async ({ overrides }) => {
    getTestimonialModuleMock.mockResolvedValue(
      okResult(mockTestimonialModule(overrides)),
    );

    await setup();

    expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
      overrides,
    );
  });

  it('logs and renders nothing when the fetch fails', async () => {
    getTestimonialModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      TESTIMONIAL_LOG.MODULE_FETCH_FAILED,
      { id: MOCK_TESTIMONIAL_MODULE_ID, error: MOCK_ERROR },
    );
  });
});
