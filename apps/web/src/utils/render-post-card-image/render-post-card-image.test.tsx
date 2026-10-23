import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

import { renderPostCardImage } from './render-post-card-image';

const heroImage = mockSanityImage();

const RenderPostCardImageHarness = ({
  post,
}: {
  post: ReturnType<typeof mockPostCard>;
}) => <>{renderPostCardImage(post)}</>;

const setup = customRender(RenderPostCardImageHarness, {
  post: mockPostCard({ heroImage }),
});

describe(renderPostCardImage, () => {
  describe('for a post with a hero image', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the hero image lazily', () => {
      const image = screen.getByRole('img', { name: heroImage.alt });

      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('never sets priority/fetchpriority on a grid image', () => {
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
