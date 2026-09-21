import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { urlForSanityImage } from '@blog/service';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTestimonialItem } from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TestimonialModule } from './testimonial-module';

const { getTestimonialModuleMock, getTenantSanityContextMock } = vi.hoisted(
  () => ({
    getTestimonialModuleMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
  }),
);

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/service')>();
  return {
    ...actual,
    service: {
      modules: {
        testimonial: {
          v1: { getTestimonialModule: getTestimonialModuleMock },
        },
      },
    },
  };
});

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'What our clients say' }),
  ctaButtons: [],
  showImages: true,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
};

const setup = customRenderAsync(TestimonialModule, {
  id: 'testimonial-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TestimonialModule.name}/>`, () => {
  beforeEach(() => {
    getTestimonialModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getTestimonialModule with the module id and the tenant Sanity context resolved from the tenant slug', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, testimonials: [] },
    });

    await setup();

    expect(getTestimonialModuleMock).toHaveBeenCalledWith(
      'testimonial-1',
      tenant,
    );
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getTestimonialModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no testimonials, never an empty landmark with a dangling aria-labelledby', async () => {
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, testimonials: [] },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders the resolved testimonial quotes', async () => {
    const testimonials = [
      makeTestimonialItem({ id: 'testimonial-1', name: 'Ada Lovelace' }),
      makeTestimonialItem({ id: 'testimonial-2', name: 'Grace Hopper' }),
    ];
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, testimonials },
    });

    await setup();

    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThan(0);
  });

  it('builds each avatarSrc through the SanityImage URL builder at 112px when a testimonial has a photo', async () => {
    const photo = makeSanityImage();
    const testimonials = [
      makeTestimonialItem({
        id: 'testimonial-1',
        name: 'Ada Lovelace',
        photo,
      }),
    ];
    getTestimonialModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, testimonials },
    });

    await setup();

    const expectedUrl = urlForSanityImage(
      photo,
      DEFAULT_TENANT_SANITY_CONTEXT,
      { width: 112, height: 112, fit: 'crop', quality: 75 },
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', expectedUrl);
  });
});
