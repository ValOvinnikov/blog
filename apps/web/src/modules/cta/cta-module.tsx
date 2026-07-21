import { service } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and renders it through the `CtaModule`
 * ui organism, with the action link built from a `SmartLink`. The only place
 * this module's service and ui meet.
 */
export async function CtaModule({ id }: ICtaModuleProps) {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  const { heading, text, action } = result.data;

  return (
    <CtaModuleUi
      heading={heading}
      headingId="cta-module-heading"
      text={text}
      action={
        action ? (
          <SmartLink href={action.href} target={action.target}>
            {action.label}
          </SmartLink>
        ) : null
      }
    />
  );
}
