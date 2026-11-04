'use client';

import { ICONS, SIZE, type TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import {
  ASSET_UPLOAD_INPUT_TEST_ID,
  ASSET_UPLOAD_LAYOUT,
  type TAssetUploadLayout,
} from '@platform/constants/asset-upload';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TEmailLogoKind } from '@platform/constants/email-logo';
import { ICON_SIZE } from '@platform/constants/icon';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useRef } from 'react';

import { assetUploadActionsVariants } from './asset-upload-actions-variants';

type TAssetUploadActionsProps = {
  kind: TBrandAssetKind | TEmailLogoKind;
  size: typeof SIZE.SM | typeof SIZE.MD;
  layout: TAssetUploadLayout;
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
  layout,
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
  const { root, input, pickButton, pickContent, removeButton } =
    assetUploadActionsVariants({ size, layout });
  const pickAction = hasImage ? 'replace' : 'upload';
  const pickLabel = t(`${kind}.${pickAction}`);
  // A row already names its asset, so its buttons show the bare verb and keep the asset in their accessible name.
  const isRow = size === SIZE.SM;
  const pickText = isRow ? t(pickAction) : pickLabel;

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
        data-testid={ASSET_UPLOAD_INPUT_TEST_ID}
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
        className={pickButton()}
      >
        {layout === ASSET_UPLOAD_LAYOUT.BARE ? (
          <span className={pickContent()}>
            <Icon name={ICONS.UPLOAD} size={ICON_SIZE.XS} />
            {pickText}
          </span>
        ) : (
          pickText
        )}
      </Button>
      {hasImage && (
        <Button
          type="button"
          size={SIZE.SM}
          variant={BUTTON_VARIANT.GHOST}
          onClick={onRemove}
          isDisabled={isDisabled}
          aria-describedby={describedBy}
          className={removeButton()}
        >
          {t('remove')}
        </Button>
      )}
    </div>
  );
};
