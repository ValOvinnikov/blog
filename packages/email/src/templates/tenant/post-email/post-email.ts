import type { TPostSummary, TTenantEmailBrand } from '@shinefold/config';
import type { TFontChoice } from '@shinefold/config/constants';
import { renderEmailDocument } from '@shinefold/email/html/email-document/email-document';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';
import {
  postCardAsPlainText,
  renderPostCard,
} from '@shinefold/email/templates/tenant/post-email-card/post-email-card';
import {
  POST_CONTENT_CLASS,
  POST_PAGE_CLASS,
  POST_PAGE_PADDING_X_PX,
  renderPostEmailCss,
  renderPostFooter,
  renderSiteName,
  renderTestBanner,
  resolvePostEmailFonts,
} from '@shinefold/email/templates/tenant/post-email-frame/post-email-frame';
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeAction,
} from '@shinefold/email/templates/tenant/unsubscribe/unsubscribe';

export type TPostEmailInput = {
  subject: string;
  title: string;
  excerpt: string;
  postUrl: string;
  unsubscribeUrl: string;
  brand: TTenantEmailBrand;
  brandName: string;
  darkBrand?: TTenantEmailBrand;
  headingFont?: TFontChoice;
  bodyFont?: TFontChoice;
  coverImageUrl?: string;
  summary?: TPostSummary;
  logoImageUrl?: string;
  footerPostalAddress?: string;
  isTest?: boolean;
  testBannerText?: string;
};

export type TPostEmailContent = {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

const PAGE_BLOCK_GAP_PX = 16;

export function buildPostEmail({
  subject,
  title,
  excerpt,
  postUrl,
  unsubscribeUrl,
  brand,
  brandName,
  darkBrand,
  headingFont,
  bodyFont,
  coverImageUrl,
  summary = [],
  logoImageUrl,
  footerPostalAddress,
  isTest,
  testBannerText,
}: TPostEmailInput): TPostEmailContent {
  const bannerText = isTest ? testBannerText : undefined;
  const fonts = resolvePostEmailFonts(headingFont, bodyFont);
  const card = { title, excerpt, summary, postUrl, coverImageUrl };
  const unsubscribeAction = buildUnsubscribeAction(unsubscribeUrl);
  const footerLine = `You're getting this because you subscribed to ${brandName}.`;

  const html = renderEmailDocument({
    title: subject,
    previewText: excerpt,
    css: renderPostEmailCss(darkBrand),
    pageColor: brand.surface2,
    pageClassName: POST_PAGE_CLASS,
    textColor: brand.text,
    fontStack: fonts.body,
    contentPadding: `32px ${POST_PAGE_PADDING_X_PX}px`,
    contentClassName: POST_CONTENT_CLASS,
    blockGapPx: PAGE_BLOCK_GAP_PX,
    blocks: [
      bannerText ? renderTestBanner(bannerText) : '',
      renderSiteName(brandName, brand, fonts, logoImageUrl),
      renderPostCard(card, brand, fonts),
      renderPostFooter(
        footerLine,
        unsubscribeAction,
        brand,
        footerPostalAddress,
      ),
    ],
  });

  return {
    subject,
    html,
    text: [
      ...(bannerText ? [bannerText] : []),
      postCardAsPlainText(card),
      buildPlainTextBody([footerLine], unsubscribeAction),
    ].join('\n\n'),
    headers: buildListUnsubscribeHeaders(unsubscribeUrl),
  };
}
