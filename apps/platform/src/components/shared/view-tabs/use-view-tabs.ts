import { MEDIA_QUERY } from '@platform/constants/media-query';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useId, useState } from 'react';

import type { TView } from './view-tabs';

export const useViewTabs = ({ isTabbed }: { isTabbed?: boolean } = {}) => {
  const ids = {
    edit: { tab: useId(), panel: useId() },
    preview: { tab: useId(), panel: useId() },
  };
  const [view, setView] = useState<TView>('edit');
  const isBelowLg = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const hasTabPanels = isTabbed ?? isBelowLg;

  const panelProps = (panel: TView) => ({
    id: ids[panel].panel,
    role: hasTabPanels ? 'tabpanel' : undefined,
    'aria-labelledby': hasTabPanels ? ids[panel].tab : undefined,
  });

  return {
    view,
    tabsProps: { value: view, onChange: setView, ids, isTabbed },
    panelProps,
  };
};
