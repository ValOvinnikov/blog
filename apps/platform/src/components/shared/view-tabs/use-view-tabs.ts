import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useId, useState } from 'react';

import type { TView } from './view-tabs';

export const useViewTabs = () => {
  const ids = {
    edit: { tab: useId(), panel: useId() },
    preview: { tab: useId(), panel: useId() },
  };
  const [view, setView] = useState<TView>('edit');
  // Tailwind's `lg`, where the view tabs hide and both panels show.
  const isTabbed = !useMediaQuery('(width >= 64rem)');

  const panelProps = (panel: TView) => ({
    id: ids[panel].panel,
    role: isTabbed ? 'tabpanel' : undefined,
    'aria-labelledby': isTabbed ? ids[panel].tab : undefined,
  });

  return {
    view,
    tabsProps: { value: view, onChange: setView, ids },
    panelProps,
  };
};
