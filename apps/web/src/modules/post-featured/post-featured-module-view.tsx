import { DISPLAY_MODE } from '@blog/config';
import type { TPostFeaturedModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { hasArrayGotMultipleItems } from '@blog/utils/primitives';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';

import { postFeaturedModuleViewVariants } from './post-featured-module-view-variants';

export interface IPostFeaturedModuleViewProps extends Pick<
  TPostFeaturedModule,
  'headingBlock' | 'contentAlignment' | 'displayMode'
> {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
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
        variant="section"
      />
      {leadPost && displayMode === DISPLAY_MODE.CAROUSEL && (
        <CardCarousel
          items={items}
          hasImages={hasImages}
          title={heading}
          tone={brandVariant}
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
