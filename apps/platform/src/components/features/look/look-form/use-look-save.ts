'use client';

import { ACTION_OUTCOME, type TActionOutcome } from '@blog/config';
import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from '@platform/components/shared/settings-form-shell';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  isSameStagedImage,
  persistStagedImage,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import type { TUploadErrorState } from '@platform/utils/use-upload-error-text/use-upload-error-text';
import { useState } from 'react';

type TUseLookSaveArgs = Omit<
  TUseSettingsFormArgs<TLookFormValues, { outcome: TActionOutcome }>,
  'onSubmit'
> & {
  tenantId: string;
};

export const useLookSave = ({
  tenantId,
  ...settingsArgs
}: TUseLookSaveArgs) => {
  const [brandImageError, setBrandImageError] = useState<TUploadErrorState>();

  const settings = useSettingsForm<
    TLookFormValues,
    { outcome: TActionOutcome }
  >({
    ...settingsArgs,
    onSubmit: async (vals) => {
      const { savedValues, setSavedValues, setValues } = settings;
      const savedImages: Partial<Record<TBrandAssetKind, TStagedImage>> = {};

      const finish = (outcome: TActionOutcome) => {
        setSavedValues((prev) =>
          outcome === ACTION_OUTCOME.SUCCESS
            ? { ...vals, ...savedImages }
            : { ...prev, ...savedImages },
        );
        setValues((prev) => ({ ...prev, ...savedImages }));
        return { outcome };
      };

      setBrandImageError(undefined);
      for (const kind of brandAssetKindSchema.options) {
        if (isSameStagedImage(vals[kind], savedValues[kind])) continue;
        const result = await persistStagedImage(vals[kind], {
          upload: (formData) =>
            uploadBrandAssetAction(tenantId, kind, formData),
          clear: () => clearBrandAssetAction(tenantId, kind),
        });
        if (!result.ok) {
          setBrandImageError({
            failure: result.failure,
            operation: result.operation,
            kind,
          });
          return finish(result.failure.outcome);
        }
        savedImages[kind] = result.image;
      }

      const { outcome } = await updateLookAction(tenantId, {
        preset: vals.preset,
        accentHue: vals.accentHue,
        logoHue: vals.logoHue ?? null,
        headingFont: vals.headingFont,
        bodyFont: vals.bodyFont,
        radiusScale: vals.radiusScale,
        density: vals.density,
        cardStyle: vals.cardStyle,
        headerControlStyle: vals.headerControlStyle,
        languageSwitcherStyle: vals.languageSwitcherStyle,
      });
      return finish(outcome);
    },
  });

  return { ...settings, brandImageError };
};
