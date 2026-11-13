import {
  CELL_ROW_END,
  FONT_STACK,
} from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@blog/email/html/sanitize-image-url/sanitize-image-url';

export type TEmailLogoImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

type TEmailMarkPalette = {
  logo1: string;
  logo2: string;
  logo3: string;
};

type TEmailHeaderPalette = {
  border: string;
  text: string;
};

export type TEmailHeaderLogo =
  | { markPalette: TEmailMarkPalette; logoImageUrl?: string }
  | { markImage: TEmailLogoImage }
  | { fullLogoImage: TEmailLogoImage; groundColor: string };

const MARK_SIZE_PX = 32;

export function renderEmailHeader(
  palette: TEmailHeaderPalette,
  brandName: string,
  logo: TEmailHeaderLogo,
): string {
  if ('fullLogoImage' in logo) {
    const { fullLogoImage, groundColor } = logo;
    // A fixed dark ground keeps the light lettering legible when a client's dark mode recolours backgrounds.
    return `<tr><td bgcolor="${groundColor}" style="padding:24px 32px;background-color:${groundColor};border-radius:7px 7px 0 0;">${renderImage(fullLogoImage)}${CELL_ROW_END}`;
  }

  const mark =
    'markImage' in logo
      ? renderImage(logo.markImage)
      : renderMark(brandName, logo.markPalette, logo.logoImageUrl);

  return [
    `<tr><td style="padding:24px 32px;border-bottom:1px solid ${palette.border};">`,
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
    '<td style="padding-right:8px;">',
    mark,
    '</td>',
    `<td style="font-family:${FONT_STACK};font-size:18px;font-weight:700;color:${palette.text};">${escapeHtml(brandName)}</td>`,
    '</tr></table>',
    CELL_ROW_END,
  ].join('');
}

function renderImage({ url, width, height, alt }: TEmailLogoImage): string {
  return `<img src="${escapeHtml(url)}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" style="display:block;width:${width}px;height:${height}px;border:0;" />`;
}

function renderMark(
  brandName: string,
  markPalette: TEmailMarkPalette,
  logoImageUrl?: string,
): string {
  const sanitizedLogoUrl = logoImageUrl ? sanitizeImageUrl(logoImageUrl) : null;

  if (sanitizedLogoUrl) {
    return renderImage({
      url: sanitizedLogoUrl,
      width: MARK_SIZE_PX,
      height: MARK_SIZE_PX,
      alt: `${brandName} logo`,
    });
  }

  return [
    '<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true">',
    `<polygon points="12,3 22,7 12,11 2,7" fill="${markPalette.logo1}" />`,
    `<polygon points="12,8 22,12 12,16 2,12" fill="${markPalette.logo2}" />`,
    `<polygon points="12,13 22,17 12,21 2,17" fill="${markPalette.logo3}" />`,
    '</svg>',
  ].join('');
}
