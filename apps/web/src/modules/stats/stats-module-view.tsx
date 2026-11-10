import type { IWithDataTestId } from '@blog/config';
import type { TStatsModule } from '@blog/service';
import { Text } from '@blog/ui/components/atoms/text';
import { ModuleActions } from '@web/components/shared/module-actions';
import { ModuleSection } from '@web/components/shared/module-section';

import { statsModuleViewVariants } from './stats-module-view-variants';

export interface IStatsModuleViewProps extends IWithDataTestId {
  module: TStatsModule;
  titleId: string;
}

export const StatsModuleView = ({
  module,
  titleId,
  dataTestId,
}: IStatsModuleViewProps) => {
  const { stats, footnote, ctaButtons, contentAlignment } = module;
  const v = statsModuleViewVariants({ align: contentAlignment });

  return (
    <ModuleSection module={module} titleId={titleId} dataTestId={dataTestId}>
      <dl className={v.list()}>
        {stats.map((stat) => (
          <div key={stat.id} className={v.item()}>
            <dt className={v.label()}>{stat.label}</dt>
            <dd className={v.value()}>{stat.value}</dd>
            {stat.description && (
              <dd className={v.description()}>{stat.description}</dd>
            )}
          </div>
        ))}
      </dl>
      {footnote && (
        <Text variant="footnote" className={v.footnote()}>
          {footnote}
        </Text>
      )}
      <ModuleActions actions={ctaButtons} align={contentAlignment} />
    </ModuleSection>
  );
};
