import { service } from '@blog/service';
import { ContentModule as ContentModuleUi } from '@blog/ui/organisms';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { Section } from '@web/components/shared/section';

export interface IContentModuleProps {
  id: string;
  locale: string;
}

/**
 * ContentModule — fetches `module_content` data and renders it through the
 * `ContentModule` ui organism, with the Portable Text body rendered by the
 * web-owned `PortableTextRenderer`, wrapped in `Section` (web's sole
 * per-module landmark) for the CMS-authored `brandVariant`/`layout`. The
 * only place this module's service and ui meet. No `titleId` is passed to
 * `Section` — `ContentModule` renders no heading of its own (its rich-text
 * `body` supplies any in-content headings), so the landmark has no unique
 * element to label.
 */
export async function ContentModule({ id }: IContentModuleProps) {
  const result = await service.modules.content.v1.getContent(id);

  if (!result.ok) return null;

  const { brandVariant, body, layout } = result.data;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      dataTestId={`content-module-${id}`}
    >
      <ContentModuleUi isWrapped={true}>
        <PortableTextRenderer value={body} />
      </ContentModuleUi>
    </Section>
  );
}
