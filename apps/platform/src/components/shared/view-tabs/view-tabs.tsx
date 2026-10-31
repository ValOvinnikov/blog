'use client';

import { Tabs } from '@base-ui/react/tabs';
import type { TViewTabsVariant } from '@platform/constants/view-tabs';
import { useTranslations } from 'next-intl';

import { viewTabsVariants } from './view-tabs-variants';

const VIEWS = ['edit', 'preview'] as const;

export type TView = (typeof VIEWS)[number];

export type TViewTabsProps = {
  value: TView;
  onChange: (view: TView) => void;
  ids: Record<TView, { tab: string; panel: string }>;
  isTabbed?: boolean;
  variant?: TViewTabsVariant;
  isSticky?: boolean;
  ariaLabel?: string;
};

// The panels are the page's two columns, rendered by the caller rather than
// `Tabs.Panel`, whose `hidden` attribute would also hide them on desktop.
export const ViewTabs = ({
  value,
  onChange,
  ids,
  isTabbed,
  variant,
  isSticky = false,
  ariaLabel,
}: TViewTabsProps) => {
  const t = useTranslations('viewTabs');
  const { root, list, tab } = viewTabsVariants({
    variant,
    isSticky,
    isLgHidden: isTabbed === undefined,
  });

  if (isTabbed === false) return null;

  return (
    <Tabs.Root
      value={value}
      onValueChange={(next: TView) => onChange(next)}
      className={root()}
    >
      <Tabs.List aria-label={ariaLabel ?? t('ariaLabel')} className={list()}>
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
