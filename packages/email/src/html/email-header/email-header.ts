import {
  CELL_ROW_END,
  EMAIL_WHITE,
  FONT_STACK,
} from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@blog/email/html/sanitize-image-url/sanitize-image-url';
import { toInitial } from '@blog/utils/primitives';

export type TEmailLogoImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

type TEmailHeaderPalette = {
  border: string;
  text: string;
};

export type TEmailHeaderLogo =
  | { tileColor: string; logoImageUrl?: string }
  | { markImage: TEmailLogoImage }
  | {
      fullLogoImage: TEmailLogoImage;
      groundColor: string;
      altTextColor: string;
    };

const MARK_SIZE_PX = 32;

export function renderEmailHeader(
  palette: TEmailHeaderPalette,
  brandName: string,
  logo: TEmailHeaderLogo,
): string {
  if ('fullLogoImage' in logo) {
    const { fullLogoImage, groundColor, altTextColor } = logo;
    // The logo image carries its own dark ground and 12px of padding, so it stays legible if a client's dark mode recolours the band; the text styles reach the alt text when images are blocked.
    return `<tr><td bgcolor="${groundColor}" style="padding:12px 20px;background-color:${groundColor};border-radius:7px 7px 0 0;color:${altTextColor};font-family:${FONT_STACK};font-size:18px;font-weight:700;">${renderImage(fullLogoImage)}${CELL_ROW_END}`;
  }

  const mark =
    'markImage' in logo
      ? renderImage(logo.markImage)
      : renderMark(brandName, logo.tileColor, logo.logoImageUrl);

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
  tileColor: string,
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

  return renderInitialTile(brandName, tileColor);
}

// Gmail and Outlook strip inline SVG, so the tile is a fixed-size table cell; white meets 4.5:1 on the logo ramp's light stop at every hue.
function renderInitialTile(brandName: string, tileColor: string): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" width="${MARK_SIZE_PX}" height="${MARK_SIZE_PX}" style="border-collapse:separate;">`,
    `<tr><td align="center" valign="middle" bgcolor="${tileColor}" width="${MARK_SIZE_PX}" height="${MARK_SIZE_PX}" style="width:${MARK_SIZE_PX}px;height:${MARK_SIZE_PX}px;background-color:${tileColor};border-radius:8px;color:${EMAIL_WHITE};font-family:${FONT_STACK};font-size:18px;font-weight:700;line-height:${MARK_SIZE_PX}px;text-align:center;">`,
    escapeHtml(toInitial(brandName) ?? ''),
    CELL_ROW_END,
    '</table>',
  ].join('');
}
