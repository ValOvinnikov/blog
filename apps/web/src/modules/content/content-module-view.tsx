import type { TContentModule } from '@blog/service';
import { Prose } from '@blog/ui/atoms/prose';
import { ContentModule as ContentModuleUi } from '@blog/ui/organisms/content-module';
import { PortableText } from '@web/components/shared/portable-text';
import { Section } from '@web/components/shared/section';

import { contentModuleViewVariants } from './content-module-view-variants';

export interface IContentModuleViewProps extends TContentModule {
  id: string;
}

const s = contentModuleViewVariants();

/**
 * No `titleId` is passed to `Section` — this module renders no heading of
 * its own (its rich-text `body` supplies any in-content headings), so the
 * landmark has no unique element to label.
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
        <Prose className={s.prose()}>
          <PortableText value={body} />
        </Prose>
      </ContentModuleUi>
    </Section>
  );
};
