'use client';

import { Tabs } from '@base-ui/react/tabs';
import { useTranslations } from 'next-intl';

import { viewTabsVariants } from './view-tabs-variants';

const VIEWS = ['edit', 'preview'] as const;

export type TView = (typeof VIEWS)[number];

export type TViewTabsProps = {
  value: TView;
  onChange: (view: TView) => void;
  ids: Record<TView, { tab: string; panel: string }>;
};

// The panels are the page's two columns, rendered by the caller rather than
// `Tabs.Panel`, whose `hidden` attribute would also hide them on desktop.
export const ViewTabs = ({ value, onChange, ids }: TViewTabsProps) => {
  const t = useTranslations('viewTabs');
  const { root, list, tab } = viewTabsVariants();

  return (
    <Tabs.Root
      value={value}
      onValueChange={(next: TView) => onChange(next)}
      className={root()}
    >
      <Tabs.List aria-label={t('ariaLabel')} className={list()}>
        {VIEWS.map((view) => (
          <Tabs.Tab
            key={view}
            value={view}
            id={ids[view].tab}
            aria-controls={ids[view].panel}
            className={tab()}
          >
            {t(`${view}Tab`)}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
};
