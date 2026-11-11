import {
  HTTP_STATUS,
  LOCALE_BCP47_TAGS,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
} from '@blog/config';
import { CACHE_CONTROL, ROBOTS_DIRECTIVE } from '@web/constants/http';
import { escapeXml } from '@web/utils/escape-xml';
import { NextResponse } from 'next/server';

const UNAVAILABLE_HEADERS = {
  'Cache-Control': CACHE_CONTROL.PRIVATE_NO_STORE,
  'X-Robots-Tag': ROBOTS_DIRECTIVE.NOINDEX,
};

const PAGE_STYLE =
  ':root{color-scheme:light dark;font-family:system-ui,sans-serif}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;text-align:center}h1{font-size:1.5rem;margin:0 0 8px}p{margin:0;opacity:.75}a{display:inline-block;margin-top:16px;color:inherit}';

export const siteUnavailableStatus = (): NextResponse =>
  new NextResponse(null, {
    status: HTTP_STATUS.SERVICE_UNAVAILABLE,
    headers: UNAVAILABLE_HEADERS,
  });

export const siteUnavailablePage = (
  locale: TLocaleIsoCode,
  accountHref?: string,
): NextResponse => {
  const { heading, text, manageAccount } =
    SITE_MESSAGES_BY_LOCALE[locale].siteUnavailable;
  const title = escapeXml(heading);
  const accountLink = accountHref
    ? `<a href="${escapeXml(accountHref)}">${escapeXml(manageAccount)}</a>`
    : '';
  const html = `<!doctype html><html lang="${LOCALE_BCP47_TAGS[locale]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="${ROBOTS_DIRECTIVE.NOINDEX}"><title>${title}</title><style>${PAGE_STYLE}</style></head><body><main><h1>${title}</h1><p>${escapeXml(text)}</p>${accountLink}</main></body></html>`;

  return new NextResponse(html, {
    status: HTTP_STATUS.SERVICE_UNAVAILABLE,
    headers: {
      ...UNAVAILABLE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
