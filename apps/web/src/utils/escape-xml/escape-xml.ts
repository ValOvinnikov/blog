const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export const escapeXml = (value: string): string => {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
};
