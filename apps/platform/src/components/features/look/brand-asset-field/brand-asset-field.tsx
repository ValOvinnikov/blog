'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  quickClientImageCheck,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import Image from 'next/image';
import { unstable_rethrow } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type AriaAttributes,
  type ChangeEvent,
  useRef,
  useState,
  useTransition,
} from 'react';

import { brandAssetFieldVariants } from './brand-asset-field-variants';

export type TBrandAssetFieldProps = {
  tenantId: string;
  kind: TBrandAssetKind;
  label: string;
  hint: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Uploads/clears persist immediately through their own server actions —
 * unlike the rest of the Look tab, a file selection isn't staged behind
 * "Save changes", the same way any native upload control takes effect right
 * away. On failure `onChange` is never called, so the previously saved
 * value (and its thumbnail) stays displayed.
 */
export const BrandAssetField = ({
  tenantId,
  kind,
  label,
  hint,
  currentUrl,
  onChange,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TBrandAssetFieldProps) => {
  const t = useTranslations('brandAssetField');
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
  } = brandAssetFieldVariants({ kind });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      try {
        const result = await uploadBrandAssetAction(tenantId, kind, formData);
        if (result.ok) {
          onChange(result.url);
        } else {
          setError(result.error);
        }
      } catch (thrownError) {
        // Re-throws unchanged if this is Next's own redirect/notFound digest
        // (e.g. the tenant gate inside the action) — anything else (a
        // network failure, or the platform rejecting the request before the
        // action body even runs, like a body-size-limit 413) falls through
        // to the same readable-error path the action's own `{ ok: false }`
        // result uses.
        unstable_rethrow(thrownError);
        setError(t('unexpectedError'));
      }
    });
  };

  const handleRemove = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await clearBrandAssetAction(tenantId, kind);
        if (result.ok) {
          onChange(undefined);
        } else {
          setError(result.error);
        }
      } catch (thrownError) {
        unstable_rethrow(thrownError);
        setError(t('unexpectedError'));
      }
    });
  };

  const lowerLabel = label.toLowerCase();

  return (
    <div className={root()}>
      <div className={top()}>
        <span className={thumb()}>
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={t('currentAlt', { label: lowerLabel })}
              fill={true}
              sizes="48px"
              className={thumbImage()}
              // A vector source has no raster grid for the optimizer to
              // resample — and skipping it avoids needing
              // `images.dangerouslyAllowSVG` in next.config.ts at all.
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
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(',')}
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
          {isPending
            ? t('uploading')
            : currentUrl
              ? t('replace', { label: lowerLabel })
              : t('upload', { label: lowerLabel })}
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
            {t('remove')}
          </Button>
        )}
      </div>

      {error && <Alert type={ALERT_TYPE.ERROR} title={error} />}
    </div>
  );
};
