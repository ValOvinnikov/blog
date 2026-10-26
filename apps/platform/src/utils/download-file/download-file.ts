export const downloadFile = (
  link: HTMLAnchorElement,
  fileName: string,
  content: string,
): void => {
  const url = URL.createObjectURL(new Blob([content]));

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
