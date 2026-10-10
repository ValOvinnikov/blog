import type { TMaybeUndefined } from '@blog/config';

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
  { ok: true; image: TStagedImage } | { ok: false; error: string };

type TPersistStagedImageActions = {
  upload: (
    formData: FormData,
  ) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  clear: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

export const persistStagedImage = async (
  image: TStagedImage,
  { upload, clear }: TPersistStagedImageActions,
): Promise<TPersistStagedImageResult> => {
  if (!image.file) {
    const result = await clear();
    return result.ok ? { ok: true, image: { url: undefined } } : result;
  }
  const formData = new FormData();
  formData.append('file', image.file);
  const result = await upload(formData);
  return result.ok ? { ok: true, image: { url: result.url } } : result;
};
