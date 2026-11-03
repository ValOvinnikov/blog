'use client';

import type { TMaybeUndefined, TPresetId } from '@blog/config';
import type { TLookField } from '@blog/db/constants';
import type { TLookCard } from '@platform/constants/look-card';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import { createContext, useContext, type ReactNode } from 'react';

export type TLookFormContext = {
  tenantName: string;
  values: TLookFormValues;
  updateField: TLookFormFieldSetter;
  isLocked: (field: TLookField) => boolean;
  hasCardChanges: (card: TLookCard) => boolean;
  isDivergedFromPreset: boolean;
  isAccentHueRejected: boolean;
  accentHueFieldId: string;
  repickKinds: readonly TBrandAssetKind[];
  brandAssetFieldIds: Record<TBrandAssetKind, string>;
  brandImageError: TMaybeUndefined<{ kind: TBrandAssetKind; message: string }>;
  changePreset: (preset: TPresetId) => void;
  resetToPreset: () => void;
  isSubmenuPreviewOpen: boolean;
  setIsSubmenuPreviewOpen: (isOpen: boolean) => void;
  previewDevice: TPreviewDevice;
  setPreviewDevice: (device: TPreviewDevice) => void;
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
