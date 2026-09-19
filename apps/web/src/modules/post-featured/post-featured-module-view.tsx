import { DISPLAY_MODE } from '@blog/config';
import type { TPostFeaturedModule } from '@blog/service';
import { CardGrid } from '@blog/ui/organisms/card-grid';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';

import { postFeaturedModuleViewVariants } from './post-featured-module-view-variants';

export interface IPostFeaturedModuleViewProps extends Omit<
  TPostFeaturedModule,
  'posts' | 'showImages'
> {
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

export const PostFeaturedModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostFeaturedModuleViewProps) => {
  const s = postFeaturedModuleViewVariants();

  const { heading } = headingBlock;

  const [leadPost, ...tailPosts] = items;
  const [soloTailPost] = tailPosts;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
      />
      {leadPost && displayMode === DISPLAY_MODE.CAROUSEL && (
        <CardCarousel
          items={items}
          hasImages={hasImages}
          title={heading}
          tone={brandVariant}
        />
      )}
      {leadPost && displayMode !== DISPLAY_MODE.CAROUSEL && (
        <div className={s.leadGroup()}>
          <MediaCardItem
            item={leadPost}
            isLead={true}
            isSplit={true}
            hasImage={hasImages}
            dataTestId={`${dataTestId}-lead`}
          />
          {tailPosts.length === 1 && soloTailPost && (
            <MediaCardItem
              item={soloTailPost}
              isSplit={true}
              hasImage={hasImages}
              dataTestId={`${dataTestId}-tail`}
            />
          )}
          {tailPosts.length > 1 && (
            <CardGrid
              columns={2}
              className={s.grid()}
              dataTestId={`${dataTestId}-tail-grid`}
            >
              {tailPosts.map((post) => (
                <MediaCardItem key={post.id} item={post} hasImage={hasImages} />
              ))}
            </CardGrid>
          )}
        </div>
      )}
    </Section>
  );
};
