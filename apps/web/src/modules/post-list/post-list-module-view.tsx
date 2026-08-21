import type { TPostListModule } from '@blog/service';
import { Pagination } from '@blog/ui/organisms/pagination';
import {
  type IPostCardData,
  PostsSection,
} from '@blog/ui/organisms/posts-section';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

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
  'posts' | 'currentPage' | 'totalPages' | 'emptyMessage'
> {
  items: IPostCardData[];
  titleId: string;
  dataTestId: string;
  titleFallback: string;
  emptyMessage?: string;
  pagination?: IPostListModulePagination;
}

/**
 * PostListModuleView — shared render shell for the archive (`PostListModule`)
 * and the teaser (`PostLatestModule`): a labeled `Section` wrapping
 * `PostsSection` plus an optional `Pagination`. `titleId`/`dataTestId`/
 * `titleFallback` are caller-supplied since the accessible name and test id
 * differ per module.
 */
export const PostListModuleView = ({
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleId,
  dataTestId,
  titleFallback,
  emptyMessage,
  pagination,
}: IPostListModuleViewProps) => {
  const { heading, supportingText, align } = sectionHeader;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <PostsSection
        posts={items}
        title={heading}
        titleId={titleId}
        titleFallback={titleFallback}
        supportingText={supportingText}
        align={align}
        linkAs={SmartLink}
        isWrapped={true}
        emptyMessage={emptyMessage}
      />
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
