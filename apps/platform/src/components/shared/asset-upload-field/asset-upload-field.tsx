'use client';

import { ASSET_UPLOAD_LAYOUT } from '@platform/constants/asset-upload';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { assetUploadFieldVariants } from './asset-upload-field-variants';
import type {
  TAssetUploadControl,
  TAssetUploadSpec,
} from './asset-upload-spec';
import { AssetUploadActions } from './components/asset-upload-actions';
import { AssetUploadDetails } from './components/asset-upload-details';
import { AssetUploadThumb } from './components/asset-upload-thumb';
import { useAssetFileChoice } from './use-asset-file-choice';

export type TAssetUploadFieldProps = {
  label: string;
  hint?: string;
  image: TStagedImage;
  onStage: (image: TStagedImage) => void;
  asset: TAssetUploadSpec;
  control?: TAssetUploadControl;
  error?: string;
};

// Picking or removing a file only stages it; the page's Save uploads it.
export const AssetUploadField = ({
  label,
  hint,
  image,
  onStage,
  asset,
  control = {},
  error,
}: TAssetUploadFieldProps) => {
  const {
    kind,
    size,
    acceptedMimeTypes,
    validateFile,
    layout = ASSET_UPLOAD_LAYOUT.FRAMED,
  } = asset;
  const {
    id,
    isDisabled = false,
    isLocked = false,
    describedBy: ariaDescribedBy,
  } = control;
  const { url } = image;
  const t = useTranslations('assetUploadField');
  const { validationError, handleFileChange, handleRemove } =
    useAssetFileChoice({ onStage, validateFile });
  const shownError = validationError ?? error;
  const isBare = layout === ASSET_UPLOAD_LAYOUT.BARE;
  const shownHint = isBare ? undefined : hint;
  const hintId = useId();
  const errorId = useId();
  const describedBy = joinIds(
    shownHint && hintId,
    ariaDescribedBy,
    shownError && errorId,
  );

  const {
    field,
    row,
    root,
    top,
    error: errorSlot,
  } = assetUploadFieldVariants({
    size,
    isInvalid: Boolean(shownError),
    isDisabled: isDisabled || isLocked,
  });

  const thumb = (
    <AssetUploadThumb
      url={url}
      alt={t(`${kind}.currentAlt`)}
      size={size}
      layout={layout}
    />
  );
  const actions = (
    <AssetUploadActions
      asset={{ kind, size, layout, acceptedMimeTypes }}
      hasImage={Boolean(url)}
      onFileChange={handleFileChange}
      onRemove={handleRemove}
      control={{ id, isDisabled, isLocked, describedBy }}
    />
  );
  const errorLine = shownError && (
    <p
      id={errorId}
      className={errorSlot()}
      role={validationError ? 'alert' : undefined}
    >
      {shownError}
    </p>
  );

  if (isBare) {
    return (
      <div className={field()}>
        <div className={row()}>
          {thumb}
          {actions}
        </div>
        {errorLine}
      </div>
    );
  }

  return (
    <div className={field()}>
      <div className={root()}>
        <div className={top()}>
          {thumb}
          <AssetUploadDetails
            label={label}
            image={image}
            size={size}
            hint={hint}
            hintId={hintId}
          />
        </div>

        {actions}
      </div>
      {errorLine}
    </div>
  );
};
