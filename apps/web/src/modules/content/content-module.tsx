import { service } from '@blog/service';
import { ContentModule as ContentModuleUi } from '@blog/ui/organisms';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';

export interface IContentModuleProps {
  id: string;
  locale: string;
}

/**
 * ContentModule — fetches `module_content` data and renders it through the
 * `ContentModule` ui organism, with the Portable Text body rendered by the
 * web-owned `PortableTextRenderer`. The only place this module's service and
 * ui meet.
 */
export async function ContentModule({ id }: IContentModuleProps) {
  const result = await service.modules.content.v1.getContent(id);

  if (!result.ok) return null;

  const { title, body } = result.data;

  return (
    <ContentModuleUi title={title}>
      <PortableTextRenderer value={body} />
    </ContentModuleUi>
  );
}
