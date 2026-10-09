export type TStagedImage = { url: string | undefined; file?: File };

export const isSameStagedImage = (a: TStagedImage, b: TStagedImage): boolean =>
  a.url === b.url && a.file === b.file;

export const createStagingHandlers = (
  onStage: (image: TStagedImage) => void,
  unexpectedErrorLabel: string,
) => ({
  onUpload: async (formData: FormData) => {
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { ok: false as const, error: unexpectedErrorLabel };
    }
    const url = URL.createObjectURL(file);
    onStage({ url, file });
    return { ok: true as const, url };
  },
  onClear: async () => {
    onStage({ url: undefined });
    return { ok: true as const };
  },
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
