import { service } from '@blog/service';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and hands it to `CtaModuleView`.
 * The only place this module's service and ui meet.
 */
export async function CtaModule({ id }: ICtaModuleProps) {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  return <CtaModuleView id={id} {...result.data} />;
}
