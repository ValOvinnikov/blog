import type { TContentModule } from '@blog/service';
import { ContentModule as ContentModuleUi } from '@blog/ui/organisms/content-module';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { Section } from '@web/components/shared/section';

export interface IContentModuleViewProps extends TContentModule {
  id: string;
}

/**
 * Pure view for `ContentModule` — the `Section` full-bleed landmark around
 * the `ContentModule` organism, with the Portable Text body rendered by the
 * web-owned `PortableTextRenderer`. No `titleId` is passed to `Section` —
 * this module renders no heading of its own (its rich-text `body` supplies
 * any in-content headings), so the landmark has no unique element to label.
 */
export const ContentModuleView = ({
  id,
  brandVariant,
  body,
  layout,
}: IContentModuleViewProps) => {
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
};
