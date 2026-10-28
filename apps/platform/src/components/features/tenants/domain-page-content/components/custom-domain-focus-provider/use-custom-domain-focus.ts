import type { TMaybeNull } from '@blog/config';
import { createContext, useContext } from 'react';

export type TCustomDomainFocus = {
  registerHeading: (heading: TMaybeNull<HTMLHeadingElement>) => void;
  requestFocus: () => void;
};

const noop = () => {};

export const CustomDomainFocusContext = createContext<TCustomDomainFocus>({
  registerHeading: noop,
  requestFocus: noop,
});

export const useCustomDomainFocus = () => useContext(CustomDomainFocusContext);
