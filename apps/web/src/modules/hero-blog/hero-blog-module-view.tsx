import type { THeroBlogModule } from '@blog/service';
import { HeroModuleShell } from '@web/components/shared/hero-module-shell';

export interface IHeroBlogModuleViewProps {
  id: string;
  module: Extract<THeroBlogModule, { hasPost: true }>;
}

export const HeroBlogModuleView = ({
  id,
  module,
}: IHeroBlogModuleViewProps) => {
  const {
    brandVariant,
    presentation,
    eyebrow,
    heading,
    supportingText,
    sanityImage,
    ctaButtons,
    layout,
  } = module;

  return (
    <HeroModuleShell
      brandVariant={brandVariant}
      presentation={presentation}
      eyebrow={eyebrow}
      title={heading}
      excerpt={supportingText}
      layout={layout}
      dataTestId={`hero-blog-module-${id}`}
      ctaButtons={ctaButtons}
      sanityImage={sanityImage}
    />
  );
};
