import { renderElement, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

import { renderPostCardImage } from './render-post-card-image';

const MOCK_HERO_IMAGE = mockSanityImage();

describe(renderPostCardImage, () => {
  describe('for a post with a hero image', () => {
    let image: HTMLElement;

    beforeEach(() => {
      renderElement(
        <>
          {renderPostCardImage(mockPostCard({ heroImage: MOCK_HERO_IMAGE }))}
        </>,
      );
      image = screen.getByRole('img', { name: MOCK_HERO_IMAGE.alt });
    });

    it('renders the hero image lazily', () => {
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('does not prioritise loading of the grid image', () => {
      expect(image).not.toHaveAttribute('fetchpriority');
    });
  });

  it('renders nothing for a post with no hero image', () => {
    renderElement(
      <>{renderPostCardImage(mockPostCard({ heroImage: undefined }))}</>,
    );

    const image = screen.queryByRole('img');

    expect(image).not.toBeInTheDocument();
  });
});
