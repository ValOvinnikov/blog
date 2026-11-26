import type { TLookRow } from '@platform/constants/look-row';
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
  restoreLookDraft,
} from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { buildLookFormContext } from './build-look-form-context';
import type { TLookFormTenant } from './look-form-tenant';
import { canSaveLook, lookInvalidControls } from './look-save-checks';
import { useBrandAssetFieldIds } from './use-brand-asset-field-ids';
import { useCheckedFieldIds } from './use-checked-field-ids';
import { useLookDraftFields } from './use-look-draft-fields';
import { useLookSave } from './use-look-save';
import { useLookSaveErrors } from './use-look-save-errors';
import { usePreviewDevice } from './use-preview-device';

type TUseLookFormStateArgs = {
  tenant: TLookFormTenant;
  initialValues: TLookFormValues;
  savedAt?: Date;
  revealInvalidField: (row: TLookRow) => void;
};

export const useLookFormState = ({
  tenant,
  initialValues,
  savedAt,
  revealInvalidField,
}: TUseLookFormStateArgs) => {
  const { id: tenantId, name: tenantName, grants, archivedAt } = tenant;
  const fieldIds = useCheckedFieldIds();
  const brandAssetFieldIds = useBrandAssetFieldIds();
  const toast = useToast();
  const t = useTranslations('lookForm');
  const draftFields = useLookDraftFields();
  const [repickKinds, setRepickKinds] = useState<TBrandAssetKind[]>([]);
  const [isSubmenuPreviewOpen, setIsSubmenuPreviewOpen] = useState(false);
  const { previewDevice, setPreviewDevice } = usePreviewDevice();

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
    canSave: canSaveLook,
    invalidControls: (checked) =>
      lookInvalidControls(checked, fieldIds, revealInvalidField),
    draft: {
      tenantId,
      page: 'look',
      savedAt,
      fields: draftFields,
      onRestore: (draftValues) => {
        setRepickKinds(listLostStagedFiles(draftValues));
        setValues((prev) => restoreLookDraft(draftValues, prev, tenant));
      },
    },
  });
  const { fieldError, errorTitle } = useLookSaveErrors({
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
    grants,
    values,
    savedValues,
    setValues,
    updateField,
    entitlements: tenant,
    accentHueFieldId: fieldIds.accentHue,
    brandNameFieldId: fieldIds.brandName,
    buttonColorFieldIds: {
      buttonColor: fieldIds.buttonColor,
      buttonColorDark: fieldIds.buttonColorDark,
    },
    repickKinds,
    brandAssetFieldIds,
    brandImageError: fieldError,
    isSubmenuPreviewOpen,
    setIsSubmenuPreviewOpen,
    previewDevice,
    setPreviewDevice,
  });

  return { lookForm, isPending, form, errorTitle };
};
