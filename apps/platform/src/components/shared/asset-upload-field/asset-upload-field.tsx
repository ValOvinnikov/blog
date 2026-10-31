'use client';

import { SIZE, type TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { assetUploadFieldVariants } from './asset-upload-field-variants';
import { useAssetFileChoice } from './use-asset-file-choice';

export type TAssetUploadSpec = {
  kind: TBrandAssetKind | TEmailLogoKind;
  size: typeof SIZE.SM | typeof SIZE.MD;
  acceptedMimeTypes: readonly string[];
  validateFile: (file: File) => TMaybeUndefined<string>;
  stagedBadgeLabel?: string;
};

export type TAssetUploadControl = {
  id?: string;
  isDisabled?: boolean;
  describedBy?: string;
};

export type TAssetUploadFieldProps = {
  label: string;
  hint?: string;
  image: TStagedImage;
  onStage: (image: TStagedImage) => void;
  asset: TAssetUploadSpec;
  control?: TAssetUploadControl;
  error?: string;
};

const getFileName = ({ url, file }: TStagedImage): TMaybeUndefined<string> => {
  if (file) return file.name;
  if (!url) return undefined;
  return url.split(/[?#]/)[0]?.split('/').at(-1) || undefined;
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
  const { kind, size, acceptedMimeTypes, validateFile, stagedBadgeLabel } =
    asset;
  const { id, isDisabled = false, describedBy: ariaDescribedBy } = control;
  const { url, file: stagedFile } = image;
  const t = useTranslations('assetUploadField');
  const inputRef = useRef<HTMLInputElement>(null);
  const { validationError, handleFileChange, handleRemove } =
    useAssetFileChoice({ onStage, validateFile });
  const shownError = validationError ?? error;
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint && hintId, ariaDescribedBy, shownError && errorId]
    .filter(Boolean)
    .join(' ');
  const fileName = size === SIZE.SM ? getFileName(image) : undefined;

  const {
    field,
    root,
    top,
    thumb,
    thumbImage,
    text,
    titleRow,
    title,
    fileName: fileNameSlot,
    hint: hintSlot,
    actions,
    input,
    error: errorSlot,
  } = assetUploadFieldVariants({ size, isInvalid: Boolean(shownError) });

  return (
    <div className={field()}>
      <div className={root()}>
        <div className={top()}>
          <span className={thumb()}>
            {url ? (
              <Image
                src={url}
                alt={t(`${kind}.currentAlt`)}
                fill={true}
                sizes="48px"
                className={thumbImage()}
                // A vector source has no raster grid to resample, and skipping it avoids needing `images.dangerouslyAllowSVG` in next.config.ts.
                unoptimized={url.endsWith('.svg')}
              />
            ) : (
              <span aria-hidden="true">—</span>
            )}
          </span>
          <div className={text()}>
            <div className={titleRow()}>
              <p className={title()}>{label}</p>
              {stagedFile && stagedBadgeLabel && (
                <StatusBadge tone="plan" hasDot={false}>
                  {stagedBadgeLabel}
                </StatusBadge>
              )}
            </div>
            {fileName && <p className={fileNameSlot()}>{fileName}</p>}
            {hint && (
              <Text id={hintId} variant="hint" className={hintSlot()}>
                {hint}
              </Text>
            )}
          </div>
        </div>

        <div className={actions()}>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedMimeTypes.join(',')}
            className={input()}
            onChange={handleFileChange}
            tabIndex={-1}
            aria-hidden="true"
            data-testid="asset-upload-field-input"
          />
          <Button
            id={id}
            type="button"
            size={SIZE.SM}
            variant={BUTTON_VARIANT.SECONDARY}
            onClick={() => inputRef.current?.click()}
            isDisabled={isDisabled}
            aria-describedby={describedBy}
          >
            {url ? t(`${kind}.replace`) : t(`${kind}.upload`)}
          </Button>
          {url && (
            <Button
              type="button"
              size={SIZE.SM}
              variant={BUTTON_VARIANT.GHOST}
              onClick={handleRemove}
              isDisabled={isDisabled}
              aria-describedby={describedBy}
            >
              {t('remove')}
            </Button>
          )}
        </div>
      </div>
      {shownError && (
        <p
          id={errorId}
          className={errorSlot()}
          role={validationError ? 'alert' : undefined}
        >
          {shownError}
        </p>
      )}
    </div>
  );
};
