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
 * per-module landmark) for the CMS-authored `brandVariant`/`appearance`. The
 * only place this module's service and ui meet.
 *
 * `ContentModuleUi`'s own top margin (`mt-[22px]`) is neutralized via its
 * `wrapped` prop — `Section` now owns that spacing (`appearance.spacingTop`),
 * and the two would otherwise stack.
 */
export async function ContentModule({ id }: IContentModuleProps) {
  const result = await service.modules.content.v1.getContent(id);

  if (!result.ok) return null;

  const { brandVariant, title, body, appearance } = result.data;
  const titleId = `content-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      appearance={appearance}
      titleId={titleId}
      dataTestId={`content-module-${id}`}
    >
      <ContentModuleUi title={title} titleId={titleId} wrapped={true}>
        <PortableTextRenderer value={body} />
      </ContentModuleUi>
    </Section>
  );
}
