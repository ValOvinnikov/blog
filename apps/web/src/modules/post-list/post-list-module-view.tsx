import type { TPostListModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { Pagination } from '@blog/ui/components/organisms/pagination';
import { hasLength } from '@blog/utils/primitives';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import type { ReactNode } from 'react';

import { postListModuleViewVariants } from './post-list-module-view-variants';

export interface IPostListModulePagination {
  currentPage: number;
  totalPages: number;
  createHref: (page: number) => string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
}

export interface IPostListModuleViewProps extends Pick<
  TPostListModule,
  'headingBlock' | 'contentAlignment'
> {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
  grid: Pick<TPostListModule, 'columns' | 'showImages'>;
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  emptyMessage?: ReactNode;
  pagination?: IPostListModulePagination;
  children?: ReactNode;
}

export const PostListModuleView = ({
  section,
  headingBlock,
  grid,
  items,
  titleId,
  dataTestId,
  emptyMessage,
  pagination,
  contentAlignment,
  children,
}: IPostListModuleViewProps) => {
  const isEmpty = !hasLength(items);
  const v = postListModuleViewVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={section.brandVariant}
      layout={section.layout}
      appearance={section.appearance}
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
      {children ? <div className={v.leadIn()}>{children}</div> : null}
      {isEmpty ? (
        <p className={v.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <CardGrid columns={toCardGridColumns(grid.columns)}>
          {items.map((item) => (
            <MediaCardItem
              key={item.id}
              item={item}
              hasImage={grid.showImages}
            />
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
