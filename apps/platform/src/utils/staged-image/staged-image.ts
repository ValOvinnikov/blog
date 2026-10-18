import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import {
  UPLOAD_OPERATION,
  type TUploadOperation,
} from '@platform/constants/upload';
import type {
  TClearUploadResult,
  TUploadFailure,
  TUploadResult,
} from '@platform/server/uploads/upload-error';

export type TStagedImage = { url: TMaybeUndefined<string>; file?: File };

export const isSameStagedImage = (a: TStagedImage, b: TStagedImage): boolean =>
  a.url === b.url && a.file === b.file;

export const createStagingHandlers = (
  onStage: (image: TStagedImage) => void,
) => ({
  onPick: (file: File) => onStage({ url: URL.createObjectURL(file), file }),
  onClear: () => onStage({ url: undefined }),
});

type TPersistStagedImageResult =
  | { ok: true; image: TStagedImage }
  | { ok: false; failure: TUploadFailure; operation: TUploadOperation };

type TPersistStagedImageActions = {
  upload: (formData: FormData) => Promise<TUploadResult>;
  clear: () => Promise<TClearUploadResult>;
};

export const persistStagedImage = async (
  image: TStagedImage,
  { upload, clear }: TPersistStagedImageActions,
): Promise<TPersistStagedImageResult> => {
  if (!image.file) {
    const result = await clear();
    return result.outcome === ACTION_OUTCOME.SUCCESS
      ? { ok: true, image: { url: undefined } }
      : { ok: false, failure: result, operation: UPLOAD_OPERATION.CLEAR };
  }
  const formData = new FormData();
  formData.append('file', image.file);
  const result = await upload(formData);
  return result.outcome === ACTION_OUTCOME.SUCCESS
    ? { ok: true, image: { url: result.url } }
    : { ok: false, failure: result, operation: UPLOAD_OPERATION.UPLOAD };
};
