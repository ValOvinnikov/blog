import type { TMaybeUndefined } from '@blog/config';
import type { TPostCard } from '@blog/service';
import type { IMediaCardData } from '@web/components/shared/media-card-item';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import type { TSectionAppearance } from '@web/utils/build-section-scope-declarations';
import type { TSectionStyleOverrides } from '@web/utils/gate-section-style-overrides';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';
import type { ReactNode } from 'react';

export type TPostCardsSource = TSectionStyleOverrides & {
  posts: TPostCard[];
  showImages: boolean;
};

export interface IPostCardsSection {
  items: IMediaCardData[];
  appearance: TSectionAppearance;
}

export const getPostCardsSection = async (
  tenantId: TMaybeUndefined<string>,
  { posts, showImages, cardStyle, radiusScale, density }: TPostCardsSource,
  renderImage: (post: TPostCard) => ReactNode = renderPostCardImage,
): Promise<IPostCardsSection> => {
  const [items, appearance] = await Promise.all([
    toPostListItems(posts, showImages ? renderImage : undefined),
    getSectionAppearance(tenantId, { cardStyle, radiusScale, density }),
  ]);

  return { items, appearance };
};
