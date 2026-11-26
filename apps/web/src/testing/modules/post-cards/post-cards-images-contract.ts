import type { TPostCardsSource } from '@web/server/post-cards/get-post-cards-section/get-post-cards-section';
import { screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import { mockPostCard } from '@web/testing/shared/post/fixtures';

interface IPostCardsImagesContractOptions {
  setup: TAsyncSetup;
  resolvePosts: (
    source: Pick<TPostCardsSource, 'posts' | 'showImages'>,
  ) => void;
}

export const testPostCardsImagesContract = ({
  setup,
  resolvePosts,
}: IPostCardsImagesContractOptions) => {
  it.each([
    { showImages: true, imageCount: 1 },
    { showImages: false, imageCount: 0 },
  ])(
    'renders $imageCount post images when showImages is $showImages',
    async ({ showImages, imageCount }) => {
      resolvePosts({
        posts: [mockPostCard({ heroImage: mockSanityImage() })],
        showImages,
      });

      await setup();

      const images = screen.queryAllByRole('img');

      expect(images).toHaveLength(imageCount);
    },
  );
};
