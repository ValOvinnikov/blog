const JSON_MEDIA_TYPE = 'application/json';
const JSON_INDENT = 2;

export const downloadJson = (fileName: string, value: unknown): void => {
  const blob = new Blob([JSON.stringify(value, null, JSON_INDENT)], {
    type: JSON_MEDIA_TYPE,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
