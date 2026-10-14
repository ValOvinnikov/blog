'use client';

import type { TMaybeUndefined, TPresetId } from '@blog/config';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TLookCardKey } from '@platform/utils/look-form-values/look-form-values';
import { createContext, useContext, type ReactNode } from 'react';

export type TLookFormContext = {
  tenantName: string;
  values: TLookFormValues;
  updateField: TLookFormFieldSetter;
  hasCardChanges: (card: TLookCardKey) => boolean;
  isDivergedFromPreset: boolean;
  isAccentHueRejected: boolean;
  accentHueFieldId: string;
  repickKinds: readonly TBrandAssetKind[];
  changePreset: (preset: TPresetId) => void;
  resetToPreset: () => void;
};

const LookFormContext =
  createContext<TMaybeUndefined<TLookFormContext>>(undefined);

export type TLookFormProviderProps = {
  value: TLookFormContext;
  children: ReactNode;
};

export const LookFormProvider = ({
  value,
  children,
}: TLookFormProviderProps) => (
  <LookFormContext.Provider value={value}>{children}</LookFormContext.Provider>
);

export const useLookForm = (): TLookFormContext => {
  const context = useContext(LookFormContext);
  if (!context) {
    throw new Error('useLookForm must be used within a LookFormProvider');
  }
  return context;
};
