import type { TPostRelatedModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

export interface IPostRelatedModuleViewProps extends Omit<
  TPostRelatedModule,
  'posts' | 'showImages'
> {
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

export const PostRelatedModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
}: IPostRelatedModuleViewProps) => {
  const s = moduleGridActionsVariants();

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
        variant="section"
      />
      <CardGrid className={s.grid()}>
        {items.map((item) => (
          <MediaCardItem key={item.id} item={item} hasImage={hasImages} />
        ))}
      </CardGrid>
    </Section>
  );
};
