import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/components/organisms/cta-module';
import { ActionGroup } from '@web/components/shared/action-group';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { BANNER_SECTION_LAYOUT } from '@web/utils/banner-section-layout';
import { useId } from 'react';

export interface ICtaModuleViewProps extends TCtaModule {
  id: string;
}

export const CtaModuleView = ({
  id,
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
}: ICtaModuleViewProps) => {
  const titleId = useId();
  const { heading, supportingText } = headingBlock;
  const isBanner = variant === CTA_VARIANT.BANNER;

  return (
    <Section
      brandVariant={isBanner ? BRAND_VARIANT.PRIMARY : bandTone}
      layout={isBanner ? BANNER_SECTION_LAYOUT : layout}
      titleId={titleId}
      dataTestId={`cta-module-${id}`}
    >
      <CtaModuleUi
        variant={variant}
        tone={brandVariant}
        eyebrow={eyebrow}
        heading={heading}
        headingId={titleId}
        supportingText={supportingText}
        content={content ? <PortableText value={content} /> : undefined}
        image={
          image ? (
            <SanityImage
              image={image}
              width={1200}
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="lazy"
            />
          ) : undefined
        }
        actions={
          ctaButtons.length > 0 ? (
            <ActionGroup actions={ctaButtons} isOnDark={isBanner} />
          ) : undefined
        }
        footnote={footnote}
        contentPosition={contentPosition}
        contentAlignment={contentAlignment}
        mobileMediaOrder={mobileMediaOrder}
        isWrapped={true}
        spacingTop={isBanner ? layout?.spacingTop : undefined}
        spacingBottom={isBanner ? layout?.spacingBottom : undefined}
      />
    </Section>
  );
};
