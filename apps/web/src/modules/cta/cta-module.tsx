import { service } from '@blog/service';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and hands it to `CtaModuleView`.
 */
export const CtaModule = async ({ id }: ICtaModuleProps) => {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  return <CtaModuleView id={id} {...result.data} />;
};
