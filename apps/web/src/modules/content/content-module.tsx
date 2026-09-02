import { getSanityImageBaseUrl, service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { ContentModuleView } from './content-module-view';

export interface IContentModuleProps {
  id: string;
  locale: string;
}

/**
 * ContentModule — fetches `module_content` data and hands it to
 * `ContentModuleView`.
 */
export const ContentModule = async ({ id }: IContentModuleProps) => {
  const tenant = await getTenantSanityContext();
  const result = await service.modules.content.v1.getContent(id, tenant);

  if (!result.ok) return null;

  // `body` is fetched unprojected, so its embedded `bodyImage` blocks arrive
  // as raw asset references rather than already-resolved `ISanityImage`
  // values — `PortableTextRenderer` still needs a separate origin for them.
  return (
    <ContentModuleView
      id={id}
      {...result.data}
      baseUrl={getSanityImageBaseUrl(tenant)}
    />
  );
};
