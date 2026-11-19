import {
  DD_AS_CONST,
  DT_AS_CONST,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import type { TStatsModule } from '@shinefold/service';
import { Text } from '@shinefold/ui/components/atoms/text';
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
            <Text
              as={DT_AS_CONST}
              textRole={TEXT_ROLE.FIGURE_LABEL}
              className={v.label()}
            >
              {stat.label}
            </Text>
            <Text
              as={DD_AS_CONST}
              textRole={TEXT_ROLE.FIGURE}
              className={v.value()}
            >
              {stat.value}
            </Text>
            {stat.description && (
              <Text
                as={DD_AS_CONST}
                textRole={TEXT_ROLE.CARD_BODY}
                className={v.description()}
              >
                {stat.description}
              </Text>
            )}
          </div>
        ))}
      </dl>
      {footnote && (
        <Text textRole={TEXT_ROLE.FOOTNOTE} className={v.footnote()}>
          {footnote}
        </Text>
      )}
      <ModuleActions actions={ctaButtons} align={contentAlignment} />
    </ModuleSection>
  );
};
