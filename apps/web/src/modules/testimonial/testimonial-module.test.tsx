import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeTestimonialItem } from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const getRequestContextMock = vi.mocked(getRequestContext);

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'What our customers say' }),
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
};

const setup = customRenderAsync(TestimonialModule, {
  id: 'testimonial-1',
});

describe(`<${TestimonialModule.name}/>`, () => {
  beforeEach(() => {
    getTestimonialModuleMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getTestimonialModule with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: {
        ...baseModule,
        testimonials: [makeTestimonialItem({ id: 'testimonial-1' })],
      },
    });

    await setup();

    expect(getTestimonialModuleMock).toHaveBeenCalledWith(
      'testimonial-1',
      tenant,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getTestimonialModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved testimonials', async () => {
    const testimonials = [
      makeTestimonialItem({ id: 'testimonial-1' }),
      makeTestimonialItem({ id: 'testimonial-2' }),
    ];
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, testimonials },
    });

    await setup();

    expect(screen.getAllByRole('blockquote')).toHaveLength(2);
  });
});
