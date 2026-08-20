import type { TCtaModule } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

export interface ICtaModuleViewProps extends TCtaModule {
  id: string;
}

/**
 * Pure view for `CtaModule` — the `Section` full-bleed landmark around the
 * `CtaModule` organism, with the action link built from a `SmartLink`.
 */
export const CtaModuleView = ({
  id,
  brandVariant,
  sectionHeader,
  action,
  layout,
}: ICtaModuleViewProps) => {
  const titleId = `cta-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`cta-module-${id}`}
    >
      <CtaModuleUi
        heading={sectionHeader.heading}
        headingId={titleId}
        supportingText={sectionHeader.supportingText}
        align={sectionHeader.align}
        action={
          action ? (
            <SmartLink href={action.href} target={action.target}>
              {action.label}
            </SmartLink>
          ) : null
        }
        isWrapped={true}
      />
    </Section>
  );
};
