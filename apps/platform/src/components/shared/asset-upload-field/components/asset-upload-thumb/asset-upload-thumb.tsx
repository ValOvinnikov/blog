import type { SIZE, TMaybeUndefined } from '@blog/config';
import {
  ASSET_UPLOAD_LAYOUT,
  ASSET_UPLOAD_THUMB_TEST_ID,
  type TAssetUploadLayout,
} from '@platform/constants/asset-upload';
import Image from 'next/image';

import { assetUploadThumbVariants } from './asset-upload-thumb-variants';

const IMAGE_SIZES: Record<TAssetUploadLayout, string> = {
  [ASSET_UPLOAD_LAYOUT.FRAMED]: '48px',
  [ASSET_UPLOAD_LAYOUT.BARE]: '52px',
};

type TAssetUploadThumbProps = {
  url: TMaybeUndefined<string>;
  alt: string;
  size: typeof SIZE.SM | typeof SIZE.MD;
  layout: TAssetUploadLayout;
};

export const AssetUploadThumb = ({
  url,
  alt,
  size,
  layout,
}: TAssetUploadThumbProps) => {
  const isEmpty = !url;
  const { root, image } = assetUploadThumbVariants({ size, layout, isEmpty });

  return (
    <span
      className={root()}
      aria-hidden={isEmpty || undefined}
      data-testid={ASSET_UPLOAD_THUMB_TEST_ID}
    >
      {url && (
        <Image
          src={url}
          alt={alt}
          fill={true}
          sizes={IMAGE_SIZES[layout]}
          className={image()}
          // A vector source has no raster grid to resample, and skipping it avoids needing `images.dangerouslyAllowSVG` in next.config.ts.
          unoptimized={url.endsWith('.svg')}
        />
      )}
      {isEmpty && layout === ASSET_UPLOAD_LAYOUT.FRAMED && <>—</>}
    </span>
  );
};
