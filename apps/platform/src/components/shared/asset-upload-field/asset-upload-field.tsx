'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Text } from '@platform/components/shared/text';
import Image from 'next/image';
import { unstable_rethrow } from 'next/navigation';
import {
  type AriaAttributes,
  type ChangeEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';

import { assetUploadFieldVariants } from './asset-upload-field-variants';

type TAssetUploadResult =
  { ok: true; url: string } | { ok: false; error: string };

type TAssetClearResult = { ok: true } | { ok: false; error: string };

type TAssetUploadFieldSize = 'sm' | 'md';

type TAssetUploadFieldLayout = 'box' | 'row';

export type TAssetUploadFieldProps = {
  size?: TAssetUploadFieldSize;
  layout?: TAssetUploadFieldLayout;
  label: string;
  hint?: string;
  fileName?: string;
  badge?: ReactNode;
  currentUrl: string | undefined;
  currentAlt: string;
  acceptedMimeTypes: readonly string[];
  uploadLabel: string;
  uploadingLabel: string;
  removeLabel: string;
  unexpectedErrorLabel: string;
  onValidateFile: (file: File) => string | undefined;
  onUpload: (formData: FormData) => Promise<TAssetUploadResult>;
  onClear: () => Promise<TAssetClearResult>;
  onChange: (url: string | undefined) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const AssetUploadField = ({
  size = 'md',
  layout = 'box',
  label,
  hint,
  fileName,
  badge,
  currentUrl,
  currentAlt,
  acceptedMimeTypes,
  uploadLabel,
  uploadingLabel,
  removeLabel,
  unexpectedErrorLabel,
  onValidateFile,
  onUpload,
  onClear,
  onChange,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TAssetUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint && hintId, ariaDescribedBy, error && errorId]
    .filter(Boolean)
    .join(' ');

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
  } = assetUploadFieldVariants({ size, layout });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const quickError = onValidateFile(file);
    if (quickError) {
      setError(quickError);
      return;
    }

    setError(undefined);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      try {
        const result = await onUpload(formData);
        if (result.ok) {
          onChange(result.url);
        } else {
          setError(result.error);
        }
      } catch (thrownError) {
        unstable_rethrow(thrownError);
        setError(unexpectedErrorLabel);
      }
    });
  };

  const handleRemove = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await onClear();
        if (result.ok) {
          onChange(undefined);
        } else {
          setError(result.error);
        }
      } catch (thrownError) {
        unstable_rethrow(thrownError);
        setError(unexpectedErrorLabel);
      }
    });
  };

  return (
    <div className={field()}>
      <div className={root()}>
        <div className={top()}>
          <span className={thumb()}>
            {currentUrl ? (
              <Image
                src={currentUrl}
                alt={currentAlt}
                fill={true}
                sizes="48px"
                className={thumbImage()}
                // A vector source has no raster grid to resample, and skipping it avoids needing `images.dangerouslyAllowSVG` in next.config.ts.
                unoptimized={currentUrl.endsWith('.svg')}
              />
            ) : (
              <span aria-hidden="true">—</span>
            )}
          </span>
          <div className={text()}>
            <div className={titleRow()}>
              <p className={title()}>{label}</p>
              {badge}
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
            isPending={isPending}
            pendingLabel={uploadingLabel}
            aria-describedby={describedBy}
          >
            {uploadLabel}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              size={SIZE.SM}
              variant="ghost"
              onClick={handleRemove}
              isDisabled={isPending || isDisabled}
              aria-describedby={describedBy}
            >
              {removeLabel}
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
