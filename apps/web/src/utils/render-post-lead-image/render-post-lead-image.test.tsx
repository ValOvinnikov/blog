import type { ISanityImage } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makePostCard } from '@web/testing/shared/post/fixtures';

import { renderPostLeadImage } from './render-post-lead-image';

const sanityImage: ISanityImage = {
  assetId: 'image-abc123-800x600-jpg',
  alt: 'A scenic mountain range',
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 800, height: 600, aspectRatio: 800 / 600 },
  cdnBaseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
};

const RenderPostLeadImageHarness = ({
  post,
}: {
  post: ReturnType<typeof makePostCard>;
}) => <>{renderPostLeadImage(post)}</>;

const setup = customRender(RenderPostLeadImageHarness, {
  post: makePostCard({ heroImageSanity: sanityImage }),
});

describe('renderPostLeadImage', () => {
  it('renders a SanityImage for a post with a hero image', () => {
    setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveClass('size-full', 'object-cover');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('never sets priority/fetchpriority on the lead image', () => {
    setup();

    expect(screen.getByRole('img')).not.toHaveAttribute('fetchpriority');
  });

  it('renders nothing for a post with no hero image', () => {
    setup({ post: makePostCard({ heroImageSanity: undefined }) });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
