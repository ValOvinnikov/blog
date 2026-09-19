import type { TPostListModule } from '@blog/service';
import { CardGrid } from '@blog/ui/organisms/card-grid';
import { Pagination } from '@blog/ui/organisms/pagination';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
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
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  emptyMessage?: string;
  pagination?: IPostListModulePagination;
  hasImages?: boolean;
}

export const PostListModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
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
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
      />
      {isEmpty ? (
        <p className={s.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <CardGrid className={s.grid()}>
          {items.map((item) => (
            <MediaCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </CardGrid>
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
