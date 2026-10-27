import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TESTIMONIAL_HEADING,
  MOCK_TESTIMONIAL_ITEMS,
  MOCK_TESTIMONIAL_MODULE_ID,
} from '@web/testing/modules/testimonial/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const MOCK_TESTIMONIAL_MODULE = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TESTIMONIAL_HEADING }),
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  testimonials: MOCK_TESTIMONIAL_ITEMS,
};

const setup = customRenderAsync(TestimonialModule, {
  id: MOCK_TESTIMONIAL_MODULE_ID,
});

describe(`<${TestimonialModule.name}/>`, () => {
  beforeEach(() => {
    getTestimonialModuleMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getTestimonialModuleMock.mockResolvedValue(
        okResult(MOCK_TESTIMONIAL_MODULE),
      );

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

  it('renders nothing when the fetch fails', async () => {
    getTestimonialModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
