import { getSanityImageBaseUrl, service } from '@blog/service';

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
  const result = await service.modules.content.v1.getContent(id);

  if (!result.ok) return null;

  return (
    <ContentModuleView
      id={id}
      {...result.data}
      baseUrl={getSanityImageBaseUrl()}
    />
  );
};
