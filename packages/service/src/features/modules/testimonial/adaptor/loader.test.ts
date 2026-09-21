import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawTestimonialItem,
  makeRawTestimonialModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTestimonialModule } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getTestimonialModule, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTestimonialModule({
        headingBlock: makeRawHeadingBlock('What clients say'),
      }),
    );

    const testimonialModule = await getTestimonialModule(
      'testimonial-1',
      tenant,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(testimonialModule.headingBlock.heading).toBe('What clients say');
  });

  it('returns the referenced testimonials in authored order', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTestimonialModule({
        testimonials: [
          makeRawTestimonialItem({ _id: 'quote-b' }),
          makeRawTestimonialItem({ _id: 'quote-a' }),
        ],
      }),
    );

    const testimonialModule = await getTestimonialModule(
      'testimonial-1',
      tenant,
    );

    expect(testimonialModule.testimonials.map((item) => item.id)).toEqual([
      'quote-b',
      'quote-a',
    ]);
  });

  it('resolves with an empty testimonials array rather than throwing when unset', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTestimonialModule({ testimonials: null }),
    );

    const testimonialModule = await getTestimonialModule(
      'testimonial-1',
      tenant,
    );

    expect(testimonialModule.testimonials).toEqual([]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getTestimonialModule('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawTestimonialModule());

    await getTestimonialModule('testimonial-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:testimonial',
            't:tenant-a:module:testimonial-1',
            't:tenant-a:block_testimonial',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
