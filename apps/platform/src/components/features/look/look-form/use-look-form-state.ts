import { isAccentHueAccessible } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { useToast } from '@platform/context/toast-provider';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import {
  countChanges,
  isBrandAssetKind,
  listLostStagedFiles,
} from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { buildLookFormContext } from './build-look-form-context';
import { useLookDraftFields } from './use-look-draft-fields';
import { useLookSave } from './use-look-save';
import { useLookSaveErrors } from './use-look-save-errors';

type TUseLookFormStateArgs = {
  tenantId: string;
  tenantName: string;
  initialValues: TLookFormValues;
  plan: TTenantPlan;
  savedAt?: Date;
  archivedAt?: Date;
  revealInvalidField: () => void;
};

export const useLookFormState = ({
  tenantId,
  tenantName,
  initialValues,
  plan,
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
  const [isSubmenuPreviewOpen, setIsSubmenuPreviewOpen] = useState(false);

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
          ...toEffectiveLook(draftValues, plan),
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

  const lookForm = buildLookFormContext({
    tenantName,
    values,
    savedValues,
    setValues,
    updateField,
    plan,
    accentHueFieldId,
    repickKinds,
    brandAssetFieldIds,
    brandImageError: fieldError,
    isSubmenuPreviewOpen,
    setIsSubmenuPreviewOpen,
  });

  return { lookForm, isPending, form: { ...form, saveError } };
};
