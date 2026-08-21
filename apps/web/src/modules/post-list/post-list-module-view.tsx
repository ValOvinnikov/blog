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
  'posts' | 'total'
> {
  id: string;
  items: IPostCardData[];
  titleFallback: string;
  pagination?: IPostListModulePagination;
}

/**
 * `items` is always non-empty here — the wrapper's content-validity guard
 * skips rendering this view entirely when no posts resolve.
 * `sectionHeader.heading` is optional; when absent, `PostsSection` renders a
 * visually hidden `<h2>` from `titleFallback`, keeping the landmark and
 * heading outline intact. `pagination`, when present, renders `Pagination`
 * as a sibling of `PostsSection` inside the same `Section` landmark.
 */
export const PostListModuleView = ({
  id,
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleFallback,
  pagination,
}: IPostListModuleViewProps) => {
  const { heading, supportingText, align } = sectionHeader;
  const titleId = `latest-posts-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
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
