import type { TPostListModule } from '@blog/service';
import { Pagination } from '@blog/ui/organisms/pagination';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import {
  type IPostCardData,
  PostCardItem,
} from '@web/components/shared/post-card-item';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { postListModuleViewVariants } from './post-list-module-view-variants';

export interface IPostListModulePagination {
  currentPage: number;
  totalPages: number;
  createHref: (page: number) => string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
}

export interface IPostListModuleViewProps extends Omit<
  TPostListModule,
  'posts' | 'currentPage' | 'totalPages' | 'showImages'
> {
  items: IPostCardData[];
  titleId: string;
  dataTestId: string;
  accessibleTitle: string;
  emptyMessage?: string;
  pagination?: IPostListModulePagination;
  hasImages?: boolean;
}

/**
 * PostListModuleView — render shell for `PostListModule`: a labeled
 * `Section` wrapping a `PostGrid` of `PostCardItem`s (or the empty message)
 * plus an optional `Pagination`.
 */
export const PostListModuleView = ({
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleId,
  dataTestId,
  accessibleTitle,
  emptyMessage,
  pagination,
  contentAlignment,
  hasImages,
}: IPostListModuleViewProps) => {
  const isEmpty = items.length === 0;
  const s = postListModuleViewVariants();

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
      {isEmpty ? (
        <p className={s.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <PostGrid className={s.grid()}>
          {items.map((item) => (
            <PostCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </PostGrid>
      )}
      {pagination ? (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          createHref={pagination.createHref}
          ariaLabel={pagination.ariaLabel}
          previousLabel={pagination.previousLabel}
          nextLabel={pagination.nextLabel}
          linkAs={SmartLink}
        />
      ) : null}
    </Section>
  );
};
