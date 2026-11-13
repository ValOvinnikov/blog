import type { TPostLatestModule } from '@blog/service';
import {
  type IPostCardsSectionProps,
  PostCardsSection,
} from '@web/components/shared/post-cards-section';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';

export interface IPostLatestModuleViewProps
  extends
    Omit<IPostCardsSectionProps, 'gridColumns'>,
    Pick<TPostLatestModule, 'columns'> {}

export const PostLatestModuleView = ({
  columns,
  ...sectionProps
}: IPostLatestModuleViewProps) => (
  <PostCardsSection
    {...sectionProps}
    gridColumns={toCardGridColumns(columns)}
  />
);
