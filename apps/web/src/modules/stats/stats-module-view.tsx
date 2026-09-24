import type { TStatsModule } from '@blog/service';
import { Text } from '@blog/ui/components/atoms/text';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { statsModuleViewVariants } from './stats-module-view-variants';

export interface IStatsModuleViewProps extends TStatsModule {
  titleId: string;
  dataTestId: string;
}

export const StatsModuleView = ({
  brandVariant,
  headingBlock,
  stats,
  footnote,
  ctaButtons,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: IStatsModuleViewProps) => {
  if (stats.length === 0) return null;

  const columns = toModuleGridColumns(stats.length);
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const v = statsModuleViewVariants({ columns, align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
      <dl className={v.grid({ class: s.grid() })}>
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
      {footnote && <Text variant="meta">{footnote}</Text>}
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
