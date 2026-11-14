'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import type { TPromotionDiscount } from '@web/utils/promotion-discount';
import { createContext, useContext } from 'react';

import { usePromotionDiscount } from './use-promotion-discount';

interface IPromotionCodeContextValue {
  discount: TMaybeUndefined<TPromotionDiscount>;
}

const PromotionCodeContext =
  createContext<TMaybeUndefined<IPromotionCodeContextValue>>(undefined);

export const PromotionCodeProvider = ({ children }: IWithChildren) => {
  const discount = usePromotionDiscount();

  return (
    <PromotionCodeContext.Provider value={{ discount }}>
      {children}
    </PromotionCodeContext.Provider>
  );
};

export const usePromotionCode = (): IPromotionCodeContextValue => {
  const value = useContext(PromotionCodeContext);
  if (!value) {
    throw new Error(
      'usePromotionCode must be used within a PromotionCodeProvider',
    );
  }
  return value;
};
