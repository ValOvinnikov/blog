import { service } from '@blog/service';
import { Section } from '@blog/ui/atoms';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms';
import { SmartLink } from '@web/components/shared/smart-link';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and renders it through the `CtaModule`
 * ui organism, with the action link built from a `SmartLink`, wrapped in
 * `Section` for the CMS-authored `appearance`. The only place this module's
 * service and ui meet.
 *
 * `CtaModuleUi`'s own vertical spacing (`mt-[22px] py-section`) is
 * neutralized via its `wrapped` prop — `Section` now owns that spacing
 * (`appearance.spacingTop`/`spacingBottom`), and the two would otherwise
 * stack. Its `px-gutter` is untouched: `Section` adds no horizontal padding
 * of its own.
 */
export async function CtaModule({ id }: ICtaModuleProps) {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  const { heading, text, action, appearance } = result.data;

  return (
    <Section appearance={appearance} dataTestId={`cta-module-${id}`}>
      <CtaModuleUi
        heading={heading}
        headingId={`cta-${id}`}
        text={text}
        action={
          action ? (
            <SmartLink href={action.href} target={action.target}>
              {action.label}
            </SmartLink>
          ) : null
        }
        wrapped
      />
    </Section>
  );
}
