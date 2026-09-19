import type { THeroBlogModule } from '@blog/service';
import { HeroModuleShell } from '@web/modules/hero-shared';

export interface IHeroBlogModuleViewProps extends Extract<
  THeroBlogModule,
  { hasPost: true }
> {
  id: string;
}

export const HeroBlogModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  heading,
  supportingText,
  sanityImage,
  ctaButtons,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroBlogModuleViewProps) => {
  const titleId = `hero-blog-${id}`;

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
      dataTestId={`hero-blog-module-${id}`}
      ctaButtons={ctaButtons}
      sanityImage={sanityImage}
    />
  );
};
