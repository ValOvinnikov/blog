'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import {
  createStagingHandlers,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  type AriaAttributes,
  type ChangeEvent,
  useId,
  useRef,
  useState,
} from 'react';

import { assetUploadFieldVariants } from './asset-upload-field-variants';

export type TAssetUploadSpec = {
  kind: TBrandAssetKind | TEmailLogoKind;
  size: 'sm' | 'md';
  acceptedMimeTypes: readonly string[];
  validateFile: (file: File) => string | undefined;
  stagedBadgeLabel?: string;
};

export type TAssetUploadFieldProps = {
  label: string;
  hint?: string;
  image: TStagedImage;
  onStage: (image: TStagedImage) => void;
  asset: TAssetUploadSpec;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

const getFileName = ({ url, file }: TStagedImage): string | undefined => {
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
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TAssetUploadFieldProps) => {
  const { kind, size, acceptedMimeTypes, validateFile, stagedBadgeLabel } =
    asset;
  const { url, file: stagedFile } = image;
  const t = useTranslations('assetUploadField');
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint && hintId, ariaDescribedBy, error && errorId]
    .filter(Boolean)
    .join(' ');
  const { onPick, onClear } = createStagingHandlers(onStage);
  const fileName = size === 'sm' ? getFileName(image) : undefined;

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
  } = assetUploadFieldVariants({ size });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateFile(file);
    setError(validationError);
    if (!validationError) onPick(file);
  };

  const handleRemove = () => {
    setError(undefined);
    onClear();
  };

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
            type="button"
            size={SIZE.SM}
            variant="secondary"
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
              variant="ghost"
              onClick={handleRemove}
              isDisabled={isDisabled}
              aria-describedby={describedBy}
            >
              {t('remove')}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p id={errorId} className={errorSlot()} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
