import { CTA_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms/cta-module';
import { ActionGroup } from '@web/components/shared/action-group';
import { BasicTextRenderer } from '@web/components/shared/basic-text-renderer';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface ICtaModuleViewProps extends TCtaModule {
  id: string;
}

/**
 * Pure view for `CtaModule` — wraps the `CtaModule` organism in a `Section`
 * landmark. `bandTone` and `brandVariant` are distinct concerns: `bandTone`
 * colors the full-bleed section band, `brandVariant` colors the card/overlay
 * the organism paints itself.
 */
export const CtaModuleView = ({
  id,
  variant,
  brandVariant,
  bandTone,
  eyebrow,
  sectionHeader,
  content,
  image,
  contentPosition,
  contentAlignment,
  mobileMediaOrder,
  actions,
  footnote,
  layout,
}: ICtaModuleViewProps) => {
  const titleId = `cta-${id}`;
  const { heading, supportingText } = sectionHeader;

  return (
    <Section
      brandVariant={bandTone}
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
        contentPosition={contentPosition}
        contentAlignment={contentAlignment}
        mobileMediaOrder={mobileMediaOrder}
        isWrapped={true}
      />
    </Section>
  );
};
