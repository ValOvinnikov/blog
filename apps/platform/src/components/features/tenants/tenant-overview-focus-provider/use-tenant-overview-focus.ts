import type { TMaybeNull } from '@blog/config';
import { noop } from '@blog/utils/primitives';
import { createContext, useContext } from 'react';

export type TTenantOverviewFocus = {
  registerHeading: (heading: TMaybeNull<HTMLHeadingElement>) => void;
  focusHeading: () => void;
};

export const TenantOverviewFocusContext = createContext<TTenantOverviewFocus>({
  registerHeading: noop,
  focusHeading: noop,
});

export const useTenantOverviewFocus = () =>
  useContext(TenantOverviewFocusContext);
