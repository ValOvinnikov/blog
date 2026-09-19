'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import Image from 'next/image';
import { unstable_rethrow } from 'next/navigation';
import {
  type AriaAttributes,
  type ChangeEvent,
  useRef,
  useState,
  useTransition,
} from 'react';

import { assetUploadFieldVariants } from './asset-upload-field-variants';

type TAssetUploadResult =
  { ok: true; url: string } | { ok: false; error: string };

type TAssetClearResult = { ok: true } | { ok: false; error: string };

type TAssetUploadFieldSize = 'sm' | 'md';

export type TAssetUploadFieldProps = {
  size?: TAssetUploadFieldSize;
  label: string;
  hint: string;
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
  label,
  hint,
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

  const {
    root,
    top,
    thumb,
    thumbImage,
    text,
    title,
    hint: hintSlot,
    actions,
    input,
  } = assetUploadFieldVariants({ size });

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
          <p className={title()}>{label}</p>
          <p className={hintSlot()}>{hint}</p>
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
        />
        <Button
          type="button"
          size={SIZE.SM}
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          isDisabled={isPending || isDisabled}
          aria-describedby={ariaDescribedBy}
        >
          {isPending ? uploadingLabel : uploadLabel}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            size={SIZE.SM}
            variant="ghost"
            onClick={handleRemove}
            isDisabled={isPending || isDisabled}
            aria-describedby={ariaDescribedBy}
          >
            {removeLabel}
          </Button>
        )}
      </div>

      {error && <Alert type={ALERT_TYPE.ERROR} title={error} />}
    </div>
  );
};
