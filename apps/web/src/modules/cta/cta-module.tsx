import { service } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and renders it through the `CtaModule`
 * ui organism, with the action link built from a `SmartLink`, wrapped in
 * `Section` (web's sole per-module landmark) for the CMS-authored
 * `brandVariant`/`layout`. The only place this module's service and ui meet.
 */
export async function CtaModule({ id }: ICtaModuleProps) {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, action, layout } = result.data;
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
        wrapped={true}
      />
    </Section>
  );
}
