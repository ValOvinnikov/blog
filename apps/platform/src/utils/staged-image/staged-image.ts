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
