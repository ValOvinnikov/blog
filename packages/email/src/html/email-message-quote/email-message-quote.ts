import type { TTenantEmailBrand } from '@shinefold/config';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';

export function renderEmailMessageQuote(
  message: string,
  {
    border,
    surface2,
    text,
  }: Pick<TTenantEmailBrand, 'border' | 'surface2' | 'text'>,
): string {
  const messageHtml = escapeHtml(message).replace(/\r\n|\r|\n/g, '<br />');

  return `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid ${border};background-color:${surface2};color:${text};">${messageHtml}</blockquote>`;
}
