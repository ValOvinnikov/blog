import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

import { renderPostLeadImage } from './render-post-lead-image';

const heroImage = mockSanityImage();

const RenderPostLeadImageHarness = ({
  post,
}: {
  post: ReturnType<typeof mockPostCard>;
}) => <>{renderPostLeadImage(post)}</>;

const setup = customRender(RenderPostLeadImageHarness, {
  post: mockPostCard({ heroImage }),
});

describe(renderPostLeadImage, () => {
  describe('with a hero image', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the hero image lazily', () => {
      const image = screen.getByRole('img', { name: heroImage.alt });

      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('never sets priority/fetchpriority on the lead image', () => {
      const image = screen.getByRole('img', { name: heroImage.alt });

      expect(image).not.toHaveAttribute('fetchpriority');
    });
  });

  it('renders nothing for a post with no hero image', () => {
    setup({ post: mockPostCard({ heroImage: undefined }) });

    const image = screen.queryByRole('img');

    expect(image).not.toBeInTheDocument();
  });
});
