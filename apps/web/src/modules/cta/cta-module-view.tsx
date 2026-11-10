import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/components/organisms/cta-module';
import { hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { BANNER_SECTION_LAYOUT } from '@web/utils/banner-section-layout';
import { useId } from 'react';

export interface ICtaModuleViewProps {
  id: string;
  module: TCtaModule;
}

export const CtaModuleView = ({ id, module }: ICtaModuleViewProps) => {
  const titleId = useId();
  const {
    variant,
    brandVariant,
    bandTone,
    eyebrow,
    headingBlock,
    content,
    image,
    contentPosition,
    contentAlignment,
    mobileMediaOrder,
    ctaButtons,
    footnote,
    layout,
  } = module;
  const { heading, supportingText } = headingBlock;
  const isBanner = variant === CTA_VARIANT.BANNER;
  const card = { tone: brandVariant, heading, headingId: titleId };

  const slots = (
    <>
      {eyebrow && <CtaModuleUi.Eyebrow>{eyebrow}</CtaModuleUi.Eyebrow>}
      {(supportingText || content) && (
        <CtaModuleUi.Text supportingText={supportingText}>
          {content && <PortableText value={content} />}
        </CtaModuleUi.Text>
      )}
      {hasLength(ctaButtons) && (
        <CtaModuleUi.Actions>
          <ActionGroup actions={ctaButtons} isOnDark={isBanner} />
        </CtaModuleUi.Actions>
      )}
      {footnote && <CtaModuleUi.Footnote>{footnote}</CtaModuleUi.Footnote>}
      {image && (
        <CtaModuleUi.Media>
          <SanityImage
            image={image}
            width={1200}
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading="lazy"
          />
        </CtaModuleUi.Media>
      )}
    </>
  );

  return (
    <Section
      brandVariant={isBanner ? BRAND_VARIANT.PRIMARY : bandTone}
      layout={isBanner ? BANNER_SECTION_LAYOUT : layout}
      titleId={titleId}
      dataTestId={`cta-module-${id}`}
    >
      {isBanner && (
        <CtaModuleUi.Banner
          {...card}
          contentPosition={contentPosition}
          contentAlignment={contentAlignment}
          spacingTop={layout?.spacingTop}
          spacingBottom={layout?.spacingBottom}
        >
          {slots}
        </CtaModuleUi.Banner>
      )}
      {variant === CTA_VARIANT.SPLIT && (
        <CtaModuleUi.Split
          {...card}
          contentPosition={contentPosition}
          contentAlignment={contentAlignment}
          mobileMediaOrder={mobileMediaOrder}
        >
          {slots}
        </CtaModuleUi.Split>
      )}
      {variant === CTA_VARIANT.CALLOUT && (
        <CtaModuleUi.Callout {...card} contentAlignment={contentAlignment}>
          {slots}
        </CtaModuleUi.Callout>
      )}
    </Section>
  );
};
