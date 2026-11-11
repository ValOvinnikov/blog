import type { TMaybeNull } from '@blog/config';
import { noop } from '@blog/utils/primitives';
import {
  ACCORDION_VARIANT,
  type TAccordionVariant,
} from '@platform/constants/accordion';
import { createContext, useContext } from 'react';

type TAccordionContext = {
  variant: TAccordionVariant;
  isList: boolean;
  openValues: readonly string[];
  registerButton: (value: string, button: TMaybeNull<HTMLElement>) => void;
};

export const AccordionContext = createContext<TAccordionContext>({
  variant: ACCORDION_VARIANT.LIST,
  isList: false,
  openValues: [],
  registerButton: noop,
});

export const AccordionItemValueContext = createContext('');

export const useAccordionItem = () => {
  const { variant, openValues, registerButton } = useContext(AccordionContext);
  const value = useContext(AccordionItemValueContext);

  return {
    variant,
    value,
    isOpen: openValues.includes(value),
    registerButton,
  };
};
