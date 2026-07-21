const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * Escapes the five XML-reserved characters in a string so it's safe to embed
 * as text content (e.g. inside an RSS `<title>`/`<description>`). Every
 * caller building XML by hand — no templating library does this for you —
 * must run untrusted/CMS-authored strings through this first.
 */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
}
