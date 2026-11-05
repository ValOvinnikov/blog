'use client';

import type { TMaybeUndefined, TPresetId } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import type { TLookField } from '@blog/db/constants';
import type { TLookCard } from '@platform/constants/look-card';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TPresetSeededField } from '@platform/utils/look-preset/look-preset';
import { createContext, useContext } from 'react';

export type TLookFormContext = {
  tenantName: string;
  values: TLookFormValues;
  updateField: TLookFormFieldSetter;
  isLocked: (field: TLookField) => boolean;
  hasLockedFields: boolean;
  hasCardChanges: (card: TLookCard) => boolean;
  hasFieldChanged: (field: keyof TLookFormValues) => boolean;
  canResetToPreset: boolean;
  isAccentHueRejected: boolean;
  accentHueFieldId: string;
  repickKinds: readonly TBrandAssetKind[];
  brandAssetFieldIds: Record<TBrandAssetKind, string>;
  brandImageError: TMaybeUndefined<{ kind: TBrandAssetKind; message: string }>;
  changePreset: (preset: TPresetId) => void;
  isPresetValue: (field: TPresetSeededField) => boolean;
  resetFieldToPreset: (field: TPresetSeededField) => void;
  resetToPreset: () => void;
  isSubmenuPreviewOpen: boolean;
  setIsSubmenuPreviewOpen: (isOpen: boolean) => void;
  previewDevice: TPreviewDevice;
  setPreviewDevice: (device: TPreviewDevice) => void;
};

const LookFormContext =
  createContext<TMaybeUndefined<TLookFormContext>>(undefined);

export type TLookFormProviderProps = IWithChildren & {
  value: TLookFormContext;
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
