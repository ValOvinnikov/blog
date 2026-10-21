import { HTTP_STATUS, routes, type TNewsletterResult } from '@blog/config';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { privateRedirect } from '@web/utils/private-redirect';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import type { NextResponse } from 'next/server';

const redirectToNewsletterPage = async (
  request: Request,
  href: string,
): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const linkLocale = await resolveNewsletterLinkLocale(
    searchParams.get('lang'),
  );
  const pathname = toLocalizedPathname({ href, ...linkLocale });

  return privateRedirect(new URL(pathname, request.url), HTTP_STATUS.SEE_OTHER);
};

export const redirectToNewsletterResult = (
  request: Request,
  result: TNewsletterResult,
): Promise<NextResponse> =>
  redirectToNewsletterPage(request, routes.newsletterResult(result));

export const redirectToNewsletterUnsubscribeConfirmation = (
  request: Request,
  token: string,
): Promise<NextResponse> =>
  redirectToNewsletterPage(
    request,
    routes.newsletterUnsubscribeConfirmation(token),
  );
