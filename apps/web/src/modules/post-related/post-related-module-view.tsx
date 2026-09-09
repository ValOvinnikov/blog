import type { TPostRelatedModule } from '@blog/service';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import {
  type IPostCardData,
  PostCardItem,
} from '@web/components/shared/post-card-item';
import { Section } from '@web/components/shared/section';

import { postRelatedModuleViewVariants } from './post-related-module-view-variants';

export interface IPostRelatedModuleViewProps extends Omit<
  TPostRelatedModule,
  'posts' | 'showImages'
> {
  items: IPostCardData[];
  titleId: string;
  dataTestId: string;
  accessibleTitle: string;
  hasImages?: boolean;
}

/**
 * PostRelatedModuleView — render shell for `PostRelatedModule`: a labeled
 * `Section` wrapping a `PostGrid` of `PostCardItem`s. Never called with an
 * empty `items` — `PostRelatedModule` renders nothing itself in that case.
 */
export const PostRelatedModuleView = ({
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleId,
  dataTestId,
  accessibleTitle,
  contentAlignment,
  hasImages,
}: IPostRelatedModuleViewProps) => {
  const s = postRelatedModuleViewVariants();

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        heading={sectionHeader.heading}
        supportingText={sectionHeader.supportingText}
        accessibleTitle={accessibleTitle}
        id={titleId}
        level={2}
        align={contentAlignment}
      />
      <PostGrid className={s.grid()}>
        {items.map((item) => (
          <PostCardItem key={item.id} item={item} hasImage={hasImages} />
        ))}
      </PostGrid>
    </Section>
  );
};
