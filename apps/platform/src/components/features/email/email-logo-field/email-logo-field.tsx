'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { clearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import {
  ACCEPTED_EMAIL_LOGO_MIME_TYPES,
  quickClientEmailLogoCheck,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';
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

import { emailLogoFieldVariants } from './email-logo-field-variants';

export type TEmailLogoFieldProps = {
  tenantId: string;
  target: TEmailLogoTarget;
  label: string;
  hint: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Uploads/clears persist immediately through their own server actions,
 * same as the Look tab's `BrandAssetField` — a file selection isn't staged
 * behind a "Save changes" button. Deliberately not the same component:
 * this one enforces email-specific limits (`validateEmailLogoUpload`) and
 * writes to either the tenant's `email_config` row or one template's
 * `email_templates` row, resolved by `target`.
 */
export const EmailLogoField = ({
  tenantId,
  target,
  label,
  hint,
  currentUrl,
  onChange,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TEmailLogoFieldProps) => {
  const t = useTranslations('emailLogoField');
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
  } = emailLogoFieldVariants();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const quickError = quickClientEmailLogoCheck(file);
    if (quickError) {
      setError(
        quickError.key === 'unsupportedType'
          ? t('unsupportedType')
          : t('tooLarge', { limit: quickError.limit }),
      );
      return;
    }

    setError(undefined);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      try {
        const result = await uploadEmailLogoAction(tenantId, target, formData);
        if (result.ok) {
          onChange(result.url);
        } else {
          setError(result.error);
        }
      } catch (thrownError) {
        unstable_rethrow(thrownError);
        setError(t('unexpectedError'));
      }
    });
  };

  const handleRemove = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await clearEmailLogoAction(tenantId, target);
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
          accept={ACCEPTED_EMAIL_LOGO_MIME_TYPES.join(',')}
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
