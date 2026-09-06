import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { ContentModuleView } from './content-module-view';

export interface IContentModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * ContentModule — fetches `module_content` data and hands it to
 * `ContentModuleView`.
 */
export const ContentModule = async ({ id, tenant }: IContentModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.content.v1.getContent(id, tenantContext);

  if (!result.ok) return null;

  return <ContentModuleView id={id} {...result.data} />;
};
