import type { THeroStatementModule } from '@blog/service';
import { HeroModuleShell } from '@web/modules/hero-shared';

export interface IHeroStatementModuleViewProps extends THeroStatementModule {
  id: string;
}

export const HeroStatementModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  headingBlock,
  sanityImage,
  ctaButtons,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroStatementModuleViewProps) => {
  const titleId = `hero-statement-${id}`;
  const { heading, supportingText } = headingBlock;

  return (
    <HeroModuleShell
      brandVariant={brandVariant}
      variant={variant}
      eyebrow={eyebrow}
      title={heading}
      titleId={titleId}
      excerpt={supportingText}
      contentPosition={contentPosition}
      contentAlignment={contentAlignment}
      mediaOrder={mediaOrder}
      layout={layout}
      dataTestId={`hero-statement-module-${id}`}
      ctaButtons={ctaButtons}
      sanityImage={sanityImage}
    />
  );
};
