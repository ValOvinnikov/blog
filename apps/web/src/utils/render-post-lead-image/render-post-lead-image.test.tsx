import { renderElement, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

import { renderPostLeadImage } from './render-post-lead-image';

const MOCK_HERO_IMAGE = mockSanityImage();

describe(renderPostLeadImage, () => {
  describe('for a post with a hero image', () => {
    beforeEach(() => {
      renderElement(
        <>
          {renderPostLeadImage(mockPostCard({ heroImage: MOCK_HERO_IMAGE }))}
        </>,
      );
    });

    it('renders the hero image lazily', () => {
      const image = screen.getByRole('img', { name: MOCK_HERO_IMAGE.alt });

      const attributes = Object.fromEntries(
        Array.from(image.attributes, ({ name, value }) => [name, value]),
      );
      const { loading } = attributes;

      expect(loading).toBe('lazy');
    });

    it('does not prioritise loading of the lead image', () => {
      const image = screen.getByRole('img', { name: MOCK_HERO_IMAGE.alt });

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
