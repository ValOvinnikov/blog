'use client';

import { clearBrandAssetAction } from '@admin/server/site-config/clear-brand-asset-action';
import { uploadBrandAssetAction } from '@admin/server/site-config/upload-brand-asset-action';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  quickClientImageCheck,
  type TBrandAssetKind,
} from '@admin/utils/brand-asset-limits/brand-asset-limits';
import { ALERT_TYPE, Size } from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { type ChangeEvent, useRef, useState, useTransition } from 'react';

import { brandAssetFieldVariants } from './brand-asset-field-variants';

export type TBrandAssetFieldProps = {
  tenantSlug: string;
  kind: TBrandAssetKind;
  label: string;
  hint: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
};

/**
 * Uploads/clears persist immediately through their own server actions —
 * unlike the rest of the Look tab, a file selection isn't staged behind
 * "Save changes", the same way any native upload control takes effect right
 * away. On failure `onChange` is never called, so the previously saved
 * value (and its thumbnail) stays displayed.
 */
export function BrandAssetField({
  tenantSlug,
  kind,
  label,
  hint,
  currentUrl,
  onChange,
}: TBrandAssetFieldProps) {
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
  } = brandAssetFieldVariants();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const quickError = quickClientImageCheck(file, kind);
    if (quickError) {
      setError(quickError);
      return;
    }

    setError(undefined);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const result = await uploadBrandAssetAction(tenantSlug, kind, formData);
      if (result.ok) {
        onChange(result.url);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    setError(undefined);
    startTransition(async () => {
      const result = await clearBrandAssetAction(tenantSlug, kind);
      if (result.ok) {
        onChange(undefined);
      } else {
        setError(result.error);
      }
    });
  }

  const lowerLabel = label.toLowerCase();

  return (
    <div className={root()}>
      <div className={top()}>
        <span className={thumb()}>
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={`Current ${lowerLabel}`}
              className={thumbImage()}
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
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(',')}
          className={input()}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        <Button
          type="button"
          size={Size.SM}
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending
            ? 'Uploading…'
            : currentUrl
              ? `Replace ${lowerLabel}`
              : `Upload ${lowerLabel}`}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            size={Size.SM}
            variant="ghost"
            onClick={handleRemove}
            disabled={isPending}
          >
            Remove
          </Button>
        )}
      </div>

      {error && <Alert type={ALERT_TYPE.ERROR} message={error} />}
    </div>
  );
}
