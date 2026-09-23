import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTestimonialModule } from '@blog/service/testing/modules/fixtures';
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
        headingBlock: makeRawHeadingBlock('What people say'),
      }),
    );

    const testimonial = await getTestimonialModule('testimonial-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(testimonial.headingBlock.heading).toBe('What people say');
  });

  it('returns the referenced quotes in authored order', async () => {
    mockRun.mockResolvedValueOnce(makeRawTestimonialModule());

    const testimonial = await getTestimonialModule('testimonial-1', tenant);

    expect(testimonial.testimonials.map((item) => item.id)).toEqual([
      'block-testimonial-1',
      'block-testimonial-2',
    ]);
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
