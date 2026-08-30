import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms/cta-module';
import { ActionGroup } from '@web/components/shared/action-group';
import { BasicTextRenderer } from '@web/components/shared/basic-text-renderer';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface ICtaModuleViewProps extends TCtaModule {
  id: string;
  baseUrl: string;
}

/**
 * Pure view for `CtaModule` — wraps the `CtaModule` organism in a `Section`
 * landmark pinned to `PRIMARY` (never the authored tone) so no full-bleed
 * band competes with the card `CtaModule` paints itself; the authored
 * `brandVariant` flows down as the card/overlay tone instead.
 */
export const CtaModuleView = ({
  id,
  variant,
  brandVariant,
  eyebrow,
  sectionHeader,
  content,
  image,
  imageSide,
  mobileMediaOrder,
  actions,
  footnote,
  layout,
  baseUrl,
}: ICtaModuleViewProps) => {
  const titleId = `cta-${id}`;
  const { heading, supportingText, align } = sectionHeader;

  return (
    <Section
      brandVariant={BRAND_VARIANT.PRIMARY}
      layout={layout}
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
        content={content ? <BasicTextRenderer value={content} /> : undefined}
        image={
          image ? (
            <SanityImage
              image={image}
              baseUrl={baseUrl}
              width={1200}
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="lazy"
            />
          ) : undefined
        }
        actions={
          actions.length > 0 ? (
            <ActionGroup
              actions={actions}
              isOnDark={variant === CTA_VARIANT.BANNER}
            />
          ) : undefined
        }
        footnote={footnote}
        align={align}
        imageSide={imageSide}
        mobileMediaOrder={mobileMediaOrder}
        isWrapped={true}
      />
    </Section>
  );
};
