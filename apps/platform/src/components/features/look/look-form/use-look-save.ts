'use client';

import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from '@platform/components/shared/settings-form-shell';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import type { TUploadError } from '@platform/server/uploads/upload-error';
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
import { useState } from 'react';

type TUseLookSaveArgs = Omit<
  TUseSettingsFormArgs<TLookFormValues, { ok: boolean }>,
  'onSubmit'
> & {
  tenantId: string;
};

export const useLookSave = ({
  tenantId,
  ...settingsArgs
}: TUseLookSaveArgs) => {
  const [brandImageError, setBrandImageError] = useState<TUploadError>();

  const settings = useSettingsForm<TLookFormValues, { ok: boolean }>({
    ...settingsArgs,
    onSubmit: async (vals) => {
      const { savedValues, setSavedValues, setValues } = settings;
      const savedImages: Partial<Record<TBrandAssetKind, TStagedImage>> = {};

      const finish = (ok: boolean) => {
        setSavedValues((prev) =>
          ok ? { ...vals, ...savedImages } : { ...prev, ...savedImages },
        );
        setValues((prev) => ({ ...prev, ...savedImages }));
        return { ok };
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
          setBrandImageError(result.error);
          return finish(false);
        }
        savedImages[kind] = result.image;
      }

      const result = await updateLookAction(tenantId, {
        preset: vals.preset,
        accentHue: vals.accentHue,
        logoHue: vals.logoHue ?? null,
        headingFont: vals.headingFont,
        bodyFont: vals.bodyFont,
        radiusScale: vals.radiusScale,
        density: vals.density,
        cardStyle: vals.cardStyle,
        languageSwitcherStyle: vals.languageSwitcherStyle,
      });
      return finish(result.ok);
    },
  });

  return { ...settings, brandImageError };
};
