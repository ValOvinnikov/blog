import { blogPostPageVariants } from './blog-post-page-variants';

describe('blogPostPageVariants', () => {
  it('caps the reading column at max-w-measure at every viewport width, not just lg:', () => {
    const { content } = blogPostPageVariants();

    expect(content()).toContain('max-w-measure');
    expect(content()).not.toContain('lg:max-w-measure');
  });

  it('stretches the withRail grid rows to equal height (no lg:items-start) so the sticky rail has room to stick', () => {
    const { body } = blogPostPageVariants();

    expect(body({ withRail: true })).not.toContain('items-start');
  });
});
