'use client';

import { Tabs } from '@base-ui/react/tabs';
import { useTranslations } from 'next-intl';

import { viewTabsVariants } from './view-tabs-variants';

const LOOK_VIEWS = ['edit', 'preview'] as const;

export type TLookView = (typeof LOOK_VIEWS)[number];

export type TViewTabsProps = {
  value: TLookView;
  onChange: (view: TLookView) => void;
  ids: Record<TLookView, { tab: string; panel: string }>;
  ariaLabel: string;
};

// The panels are the page's two columns, rendered by the caller rather than
// `Tabs.Panel`, whose `hidden` attribute would also hide them on desktop.
export const ViewTabs = ({
  value,
  onChange,
  ids,
  ariaLabel,
}: TViewTabsProps) => {
  const t = useTranslations('lookForm');
  const { root, list, tab } = viewTabsVariants();

  return (
    <Tabs.Root
      value={value}
      onValueChange={(next: TLookView) => onChange(next)}
      className={root()}
    >
      <Tabs.List aria-label={ariaLabel} className={list()}>
        {LOOK_VIEWS.map((view) => (
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
