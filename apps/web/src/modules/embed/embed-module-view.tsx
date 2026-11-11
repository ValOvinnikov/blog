import { CONTAINER_WIDTH, type IWithDataTestId } from '@blog/config';
import type { TEmbedModule } from '@blog/service';
import { EmbedFrame } from '@web/components/shared/embed-frame';
import { ModuleActions } from '@web/components/shared/module-actions';
import { ModuleSection } from '@web/components/shared/module-section';

import { embedModuleViewVariants } from './embed-module-view-variants';

export interface IEmbedModuleViewProps extends IWithDataTestId {
  module: TEmbedModule;
  titleId: string;
}

export const EmbedModuleView = ({
  module,
  titleId,
  dataTestId,
}: IEmbedModuleViewProps) => {
  const { embed, ctaButtons, contentAlignment, layout } = module;

  if (!embed) return null;

  return (
    <ModuleSection module={module} titleId={titleId} dataTestId={dataTestId}>
      <EmbedFrame
        embed={embed}
        className={embedModuleViewVariants({
          isNarrow: layout?.containerWidth === CONTAINER_WIDTH.NARROW,
          align: contentAlignment,
        })}
      />
      <ModuleActions actions={ctaButtons} align={contentAlignment} />
    </ModuleSection>
  );
};
