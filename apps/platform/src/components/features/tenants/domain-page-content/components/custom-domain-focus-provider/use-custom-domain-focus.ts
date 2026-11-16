import type { TMaybeNull } from '@shinefold/config';
import { noop } from '@shinefold/utils/primitives';
import { createContext, useContext } from 'react';

export type TCustomDomainFocus = {
  registerHeading: (heading: TMaybeNull<HTMLHeadingElement>) => void;
  requestFocus: () => void;
};

export const CustomDomainFocusContext = createContext<TCustomDomainFocus>({
  registerHeading: noop,
  requestFocus: noop,
});

export const useCustomDomainFocus = () => useContext(CustomDomainFocusContext);
