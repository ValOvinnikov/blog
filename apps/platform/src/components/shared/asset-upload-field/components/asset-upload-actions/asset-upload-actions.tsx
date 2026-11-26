'use client';

import type {
  TAssetUploadControl,
  TAssetUploadSpec,
} from '@platform/components/shared/asset-upload-field/asset-upload-spec';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import {
  ASSET_UPLOAD_INPUT_TEST_ID,
  ASSET_UPLOAD_LAYOUT,
} from '@platform/constants/asset-upload';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import { ICONS, SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useRef } from 'react';

import { assetUploadActionsVariants } from './asset-upload-actions-variants';

type TAssetUploadActionsProps = {
  asset: Required<Omit<TAssetUploadSpec, 'validateFile'>>;
  hasImage: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  control: TAssetUploadControl;
};

export const AssetUploadActions = ({
  asset,
  hasImage,
  onFileChange,
  onRemove,
  control,
}: TAssetUploadActionsProps) => {
  const { kind, size, layout, acceptedMimeTypes } = asset;
  const { id, isDisabled, isLocked, describedBy } = control;
  const t = useTranslations('assetUploadField');
  const inputRef = useRef<HTMLInputElement>(null);
  const { root, input, pickButton, pickContent, removeButton } =
    assetUploadActionsVariants({ size, layout });
  const pickAction = hasImage ? 'replace' : 'upload';
  const pickLabel = t(`${kind}.${pickAction}`);
  // A row's or a bare field's label already names the asset, so the visible text drops it.
  const isBareVerb = size === SIZE.SM || layout === ASSET_UPLOAD_LAYOUT.BARE;
  const pickText = isBareVerb ? t(pickAction) : pickLabel;

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
        isAriaDisabled={isLocked}
        aria-describedby={describedBy}
        aria-label={isBareVerb ? pickLabel : undefined}
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
          isAriaDisabled={isLocked}
          aria-describedby={describedBy}
          className={removeButton()}
        >
          {t('remove')}
        </Button>
      )}
    </div>
  );
};
