'use client';

import { SIZE, type TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useRef } from 'react';

import { assetUploadActionsVariants } from './asset-upload-actions-variants';

type TAssetUploadActionsProps = {
  kind: TBrandAssetKind | TEmailLogoKind;
  size: typeof SIZE.SM | typeof SIZE.MD;
  acceptedMimeTypes: readonly string[];
  hasImage: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  id?: string;
  isDisabled: boolean;
  describedBy: TMaybeUndefined<string>;
};

export const AssetUploadActions = ({
  kind,
  size,
  acceptedMimeTypes,
  hasImage,
  onFileChange,
  onRemove,
  id,
  isDisabled,
  describedBy,
}: TAssetUploadActionsProps) => {
  const t = useTranslations('assetUploadField');
  const inputRef = useRef<HTMLInputElement>(null);
  const { root, input } = assetUploadActionsVariants({ size });
  const pickAction = hasImage ? 'replace' : 'upload';
  const pickLabel = t(`${kind}.${pickAction}`);
  // A row already names its asset, so its buttons show the bare verb and keep the asset in their accessible name.
  const isRow = size === SIZE.SM;

  return (
    <div className={root()}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedMimeTypes.join(',')}
        className={input()}
        onChange={onFileChange}
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
        aria-label={isRow ? pickLabel : undefined}
      >
        {isRow ? t(pickAction) : pickLabel}
      </Button>
      {hasImage && (
        <Button
          type="button"
          size={SIZE.SM}
          variant={BUTTON_VARIANT.GHOST}
          onClick={onRemove}
          isDisabled={isDisabled}
          aria-describedby={describedBy}
        >
          {t('remove')}
        </Button>
      )}
    </div>
  );
};
