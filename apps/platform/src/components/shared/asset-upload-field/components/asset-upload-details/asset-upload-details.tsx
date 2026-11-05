import { SIZE, type TMaybeUndefined } from '@blog/config';
import { Text } from '@platform/components/shared/text';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';

import { assetUploadDetailsVariants } from './asset-upload-details-variants';

type TAssetUploadDetailsProps = {
  label: string;
  image: TStagedImage;
  size: typeof SIZE.SM | typeof SIZE.MD;
  hint?: string;
  hintId: string;
};

const getFileName = ({ url, file }: TStagedImage): TMaybeUndefined<string> => {
  if (file) return file.name;
  if (!url) return undefined;
  return url.split(/[?#]/)[0]?.split('/').at(-1) || undefined;
};

export const AssetUploadDetails = ({
  label,
  image,
  size,
  hint,
  hintId,
}: TAssetUploadDetailsProps) => {
  const fileName = size === SIZE.SM ? getFileName(image) : undefined;
  const {
    root,
    title,
    fileName: fileNameSlot,
    hint: hintSlot,
  } = assetUploadDetailsVariants();

  return (
    <div className={root()}>
      <p className={title()}>{label}</p>
      {fileName && <p className={fileNameSlot()}>{fileName}</p>}
      {hint && (
        <Text id={hintId} variant="hint" className={hintSlot()}>
          {hint}
        </Text>
      )}
    </div>
  );
};
