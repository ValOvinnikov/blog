import type { TPostRelatedModule } from '@blog/service';
import {
  type IPostCardsSectionProps,
  PostCardsSection,
} from '@web/components/shared/post-cards-section';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

export interface IPostRelatedModuleViewProps
  extends
    Omit<IPostCardsSectionProps, 'gridColumns'>,
    Pick<TPostRelatedModule, 'columns'> {}

export const PostRelatedModuleView = ({
  columns,
  ...sectionProps
}: IPostRelatedModuleViewProps) => (
  <PostCardsSection
    {...sectionProps}
    gridColumns={
      toCardGridColumns(columns) ??
      toModuleGridColumns(sectionProps.items.length)
    }
  />
);
