import { isAccentHueAccessible, type TPresetId } from '@blog/config';
import type { TLookFormContext } from '@platform/components/features/look/look-form-provider';
import { useToast } from '@platform/context/toast-provider';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import {
  applyPresetDefaults,
  CARD_FIELDS,
  countChanges,
  isBrandAssetKind,
  isFieldChanged,
  listLostStagedFiles,
  type TLookCardKey,
} from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { useLookDraftFields } from './use-look-draft-fields';
import { useLookSave } from './use-look-save';
import { useLookSaveErrors } from './use-look-save-errors';

type TUseLookFormStateArgs = {
  tenantId: string;
  tenantName: string;
  initialValues: TLookFormValues;
  savedAt?: Date;
  archivedAt?: Date;
  revealInvalidField: () => void;
};

export const useLookFormState = ({
  tenantId,
  tenantName,
  initialValues,
  savedAt,
  archivedAt,
  revealInvalidField,
}: TUseLookFormStateArgs) => {
  const accentHueFieldId = useId();
  const brandAssetFieldIds = { logo: useId(), favicon: useId() };
  const toast = useToast();
  const t = useTranslations('lookForm');
  const draftFields = useLookDraftFields();
  const [repickKinds, setRepickKinds] = useState<TBrandAssetKind[]>([]);

  const {
    values,
    setValues,
    savedValues,
    status,
    isPending,
    form,
    brandImageError,
    clearBrandImageError,
  } = useLookSave({
    tenantId,
    brandAssetFieldIds,
    initialValues,
    archivedAt,
    onSuccess: () => {
      setRepickKinds([]);
      toast.success({
        message: t('alertSuccess'),
      });
    },
    onDiscard: () => setRepickKinds([]),
    countChanges,
    canSave: ({ accentHue }) => isAccentHueAccessible(accentHue),
    invalidControls: ({ accentHue }) => ({
      ids: isAccentHueAccessible(accentHue) ? [] : [accentHueFieldId],
      revealFirst: revealInvalidField,
    }),
    draft: {
      tenantId,
      page: 'look',
      savedAt,
      fields: draftFields,
      onRestore: (draftValues) => {
        setRepickKinds(listLostStagedFiles(draftValues));
        setValues((prev) => ({
          ...draftValues,
          logo: prev.logo,
          favicon: prev.favicon,
        }));
      },
    },
  });
  const { fieldError, saveError } = useLookSaveErrors({
    status,
    isPending,
    brandImageError,
  });

  const updateField: TLookFormFieldSetter = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (isBrandAssetKind(key)) {
      setRepickKinds((prev) => prev.filter((kind) => kind !== key));
      clearBrandImageError(key);
    }
  };

  const lookForm: TLookFormContext = {
    tenantName,
    values,
    updateField,
    hasCardChanges: (card: TLookCardKey) =>
      CARD_FIELDS[card].some((key) => isFieldChanged(key, values, savedValues)),
    isDivergedFromPreset:
      countChanges(values, applyPresetDefaults(values.preset, values)) > 0,
    isAccentHueRejected: !isAccentHueAccessible(values.accentHue),
    accentHueFieldId,
    repickKinds,
    brandAssetFieldIds,
    brandImageError: fieldError,
    changePreset: (preset: TPresetId) =>
      setValues((prev) => applyPresetDefaults(preset, prev)),
    resetToPreset: () =>
      setValues((prev) => applyPresetDefaults(prev.preset, prev)),
  };

  return { lookForm, isPending, form: { ...form, saveError } };
};
