'use client';

import type { TLookCard } from '@platform/constants/look-card';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TButtonColorField } from '@platform/utils/button-colors/button-colors';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TGrantAccess } from '@platform/utils/grant-target/grant-target';
import type { TPresetSeededField } from '@platform/utils/look-preset/look-preset';
import type { TMaybeUndefined, TPresetId } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import type { TLookField } from '@shinefold/db/constants';
import { createContext, useContext } from 'react';

export type TLookFormContext = {
  tenantName: string;
  grants: TGrantAccess<TLookField>;
  values: TLookFormValues;
  presets: readonly TPresetId[];
  updateField: TLookFormFieldSetter;
  isLocked: (field: TLookField) => boolean;
  hasLockedFields: boolean;
  hasCardChanges: (card: TLookCard) => boolean;
  hasFieldChanged: (field: keyof TLookFormValues) => boolean;
  canResetToPreset: boolean;
  isAccentHueRejected: boolean;
  accentHueFieldId: string;
  isBrandNameTooLong: boolean;
  brandNameFieldId: string;
  buttonColorFieldIds: Record<TButtonColorField, string>;
  shownBrandName: string;
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
