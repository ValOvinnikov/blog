import type { THeroStatementModule } from '@shinefold/service';
import { Hero } from '@shinefold/ui/components/organisms/hero';
import { HeroModuleShell } from '@web/components/shared/hero-module-shell';

export interface IHeroStatementModuleViewProps {
  id: string;
  module: THeroStatementModule;
}

export const HeroStatementModuleView = ({
  id,
  module,
}: IHeroStatementModuleViewProps) => {
  const {
    brandVariant,
    presentation,
    eyebrow,
    headingBlock,
    sanityImage,
    ctaButtons,
    footnote,
    layout,
  } = module;
  const { heading, supportingText } = headingBlock;

  return (
    <HeroModuleShell
      brandVariant={brandVariant}
      presentation={presentation}
      eyebrow={eyebrow}
      title={heading}
      excerpt={supportingText}
      layout={layout}
      dataTestId={`hero-statement-module-${id}`}
      ctaButtons={ctaButtons}
      sanityImage={sanityImage}
    >
      {footnote ? <Hero.Footnote>{footnote}</Hero.Footnote> : undefined}
    </HeroModuleShell>
  );
};
