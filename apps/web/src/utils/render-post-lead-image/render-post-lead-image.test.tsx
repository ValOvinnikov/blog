import { renderElement, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

import { renderPostLeadImage } from './render-post-lead-image';

const MOCK_HERO_IMAGE = mockSanityImage();

describe(renderPostLeadImage, () => {
  describe('for a post with a hero image', () => {
    let image: HTMLElement;

    beforeEach(() => {
      renderElement(
        <>
          {renderPostLeadImage(mockPostCard({ heroImage: MOCK_HERO_IMAGE }))}
        </>,
      );
      image = screen.getByRole('img', { name: MOCK_HERO_IMAGE.alt });
    });

    it('renders the hero image lazily', () => {
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('does not prioritise loading of the lead image', () => {
      expect(image).not.toHaveAttribute('fetchpriority');
    });
  });

  it('renders nothing for a post with no hero image', () => {
    renderElement(
      <>{renderPostLeadImage(mockPostCard({ heroImage: undefined }))}</>,
    );

    const image = screen.queryByRole('img');

    expect(image).not.toBeInTheDocument();
  });
});
