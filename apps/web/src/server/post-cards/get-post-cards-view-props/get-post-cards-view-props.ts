import type { TMaybeUndefined } from '@shinefold/config';
import type { TPostCard } from '@shinefold/service';
import type { IMediaCardData } from '@web/components/shared/media-card-item';
import type { IPostCardsSectionProps } from '@web/components/shared/post-cards-section';
import type { TModuleSection } from '@web/components/shared/section';
import {
  getPostCardsSection,
  type TPostCardsSource,
} from '@web/server/post-cards/get-post-cards-section/get-post-cards-section';
import type { ReactNode } from 'react';

export type TPostCardsModuleData = TPostCardsSource &
  Pick<TModuleSection, 'brandVariant' | 'layout'> &
  Pick<IPostCardsSectionProps, 'headingBlock' | 'contentAlignment'>;

export type TPostCardsViewIds = Pick<
  IPostCardsSectionProps,
  'titleId' | 'dataTestId'
>;

export interface IPostCardsViewProps
  extends
    TPostCardsViewIds,
    Pick<IPostCardsSectionProps, 'headingBlock' | 'contentAlignment'> {
  section: TModuleSection;
  items: IMediaCardData[];
}

export const getPostCardsViewProps = async (
  tenantId: TMaybeUndefined<string>,
  data: TPostCardsModuleData,
  ids: TPostCardsViewIds,
  renderImage?: (post: TPostCard) => ReactNode,
): Promise<IPostCardsViewProps> => {
  const { brandVariant, layout, headingBlock, contentAlignment } = data;
  const { items, appearance } = await getPostCardsSection(
    tenantId,
    data,
    renderImage,
  );

  return {
    section: { brandVariant, layout, appearance },
    items,
    headingBlock,
    contentAlignment,
    ...ids,
  };
};
