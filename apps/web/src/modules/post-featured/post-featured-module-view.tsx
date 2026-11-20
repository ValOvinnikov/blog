import { DISPLAY_MODE } from '@shinefold/config';
import type { TPostFeaturedModule } from '@shinefold/service';
import { CardGrid } from '@shinefold/ui/components/organisms/card-grid';
import { hasArrayGotMultipleItems } from '@shinefold/utils/primitives';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type TModuleSection } from '@web/components/shared/section';

import { postFeaturedModuleViewVariants } from './post-featured-module-view-variants';

export interface IPostFeaturedModuleViewProps extends Pick<
  TPostFeaturedModule,
  'headingBlock' | 'contentAlignment' | 'displayMode'
> {
  section: TModuleSection;
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

export const PostFeaturedModuleView = ({
  section,
  headingBlock,
  items,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostFeaturedModuleViewProps) => {
  const v = postFeaturedModuleViewVariants();

  const { brandVariant, layout, appearance } = section;
  const { heading } = headingBlock;

  const [leadPost, ...tailPosts] = items;
  const [soloTailPost] = tailPosts;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
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
          contentAlignment={contentAlignment}
        />
      )}
      {leadPost && displayMode !== DISPLAY_MODE.CAROUSEL && (
        <div className={v.leadGroup()}>
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
          {hasArrayGotMultipleItems(tailPosts) && (
            <CardGrid columns={2} dataTestId={`${dataTestId}-tail-grid`}>
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
