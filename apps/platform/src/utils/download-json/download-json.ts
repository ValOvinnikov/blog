const JSON_INDENT = 2;

export const downloadJson = (
  link: HTMLAnchorElement,
  fileName: string,
  value: unknown,
): void => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, JSON_INDENT)]),
  );

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
