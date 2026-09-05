import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { escapeXml } from '@web/utils/escape-xml';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

type TResultPageCopy = {
  title: string;
  message: string;
  returnHomeLabel: string;
};

type TConfirmPageCopy = {
  title: string;
  message: string;
  confirmButtonLabel: string;
  actionUrl: string;
};

/**
 * A minimal, self-contained HTML page — mirrors the confirm route's own
 * `renderConfirmationPage`, since a Route Handler returns a `Response`, not
 * JSX, and this result needs no interactivity.
 */
const renderResultPage = ({
  title,
  message,
  returnHomeLabel,
}: TResultPageCopy): string => {
  const safeTitle = escapeXml(title);
  const safeMessage = escapeXml(message);
  const safeReturnHomeLabel = escapeXml(returnHomeLabel);
  const homeHref = routes.home();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <p><a href="${homeHref}">${safeReturnHomeLabel}</a></p>
  </body>
</html>`;
};

const renderResultResponse = (
  copy: TResultPageCopy,
  status: number,
): NextResponse => {
  return new NextResponse(renderResultPage(copy), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

/**
 * The GET-rendered confirmation page: a plain, JavaScript-free `<form>`
 * whose submit `POST`s to the same URL — the only place this route mutates
 * anything.
 */
const renderConfirmPage = ({
  title,
  message,
  confirmButtonLabel,
  actionUrl,
}: TConfirmPageCopy): string => {
  const safeTitle = escapeXml(title);
  const safeMessage = escapeXml(message);
  const safeButtonLabel = escapeXml(confirmButtonLabel);
  const safeActionUrl = escapeXml(actionUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <form method="post" action="${safeActionUrl}">
      <button type="submit">${safeButtonLabel}</button>
    </form>
  </body>
</html>`;
};

/**
 * `GET /api/newsletter/unsubscribe?token=…` renders a confirmation page
 * whose single button `POST`s to this same URL. It never touches the
 * database — inbox scanners and link-prefetchers issue a `GET` on every URL
 * in an email, and a `GET` that unsubscribed would do so silently and
 * invisibly. The actual unsubscribe happens only in `POST` below.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const t = await getTranslations('newsletterUnsubscribe');
  const returnHomeLabel = t('returnHome');

  if (!token) {
    return renderResultResponse(
      {
        title: t('invalidTitle'),
        message: t('invalidMessage'),
        returnHomeLabel,
      },
      400,
    );
  }

  return new NextResponse(
    renderConfirmPage({
      title: t('confirmTitle'),
      message: t('confirmMessage'),
      confirmButtonLabel: t('confirmButtonLabel'),
      actionUrl: routes.newsletterUnsubscribe(token),
    }),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

/**
 * `POST /api/newsletter/unsubscribe?token=…` performs the unsubscribe via
 * `queries.subscribers.unsubscribeByToken` and is simultaneously the RFC
 * 8058 one-click endpoint mail clients `POST` to directly. Every outcome —
 * an unknown token, an already-used token, a missing token, or an inactive
 * tenant — renders the same calm "you're unsubscribed / no longer valid"
 * copy rather than an error page, since `unsubscribeByToken`'s own
 * `not-found` outcome is indistinguishable from "already unsubscribed" (the
 * row is deleted on success).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const t = await getTranslations('newsletterUnsubscribe');
  const returnHomeLabel = t('returnHome');
  const invalidCopy: TResultPageCopy = {
    title: t('invalidTitle'),
    message: t('invalidMessage'),
    returnHomeLabel,
  };

  if (!token) {
    return renderResultResponse(invalidCopy, 400);
  }

  try {
    const host = request.headers.get('host');
    const tenantId = await resolveTenantId(host);
    if (!tenantId) {
      logger.error('newsletter.unsubscribe_tenant_unresolved', { host });
      return renderResultResponse(invalidCopy, 200);
    }

    if (!(await isTenantActive(tenantId))) {
      logger.warn('newsletter.unsubscribe_tenant_not_active', { tenantId });
      return renderResultResponse(invalidCopy, 200);
    }

    const result = await queries.subscribers.unsubscribeByToken(
      tenantId,
      token,
    );

    if (result.outcome === 'not-found') {
      return renderResultResponse(invalidCopy, 200);
    }

    return renderResultResponse(
      {
        title: t('successTitle'),
        message: t('successMessage'),
        returnHomeLabel,
      },
      200,
    );
  } catch (error) {
    logger.error('newsletter.unsubscribe_failed', { error });
    return renderResultResponse(invalidCopy, 200);
  }
}
