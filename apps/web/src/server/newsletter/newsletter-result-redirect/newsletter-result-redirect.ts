import { HTTP_STATUS, routes, type TNewsletterResult } from '@blog/config';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { privateRedirect } from '@web/utils/private-redirect';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import type { NextResponse } from 'next/server';

export const redirectToNewsletterResult = async (
  request: Request,
  result: TNewsletterResult,
): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const linkLocale = await resolveNewsletterLinkLocale(
    searchParams.get('lang'),
  );
  const pathname = toLocalizedPathname({
    href: routes.newsletterResult(result),
    ...linkLocale,
  });

  return privateRedirect(new URL(pathname, request.url), HTTP_STATUS.SEE_OTHER);
};
