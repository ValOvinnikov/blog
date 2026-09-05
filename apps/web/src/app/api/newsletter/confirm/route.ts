import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { escapeXml } from '@web/utils/escape-xml';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';

type TConfirmationPageCopy = {
  lang: string;
  title: string;
  message: string;
  returnHomeLabel: string;
};

/**
 * A minimal, self-contained HTML page — this route handler can't render
 * through `@blog/ui` (Route Handlers return a `Response`, not JSX), and the
 * result (confirmed/invalid/error) needs no interactivity, so a hand-rolled
 * page beats inventing a new component for one static string.
 * `escapeXml` (already shared with `build-rss-feed.ts`) escapes the
 * translated copy before it's interpolated into markup.
 */
const renderConfirmationPage = ({
  lang,
  title,
  message,
  returnHomeLabel,
}: TConfirmationPageCopy): string => {
  const safeTitle = escapeXml(title);
  const safeMessage = escapeXml(message);
  const safeReturnHomeLabel = escapeXml(returnHomeLabel);
  const homeHref = routes.home();

  return `<!doctype html>
<html lang="${lang}">
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

/**
 * `GET /api/newsletter/confirm?token=…` — the double opt-in confirmation link
 * every newsletter confirmation email points at. Flips the matching
 * `subscribers` row from `pending` to `active` via
 * `queries.subscribers.confirmSubscriber` and renders a plain result page;
 * `confirmed`/`already-confirmed` both read as success (the query's own
 * idempotency guarantee).
 *
 * `/api` routes are excluded from `proxy.ts`'s matcher, so the `x-tenant-id`
 * header it threads to Server Components/Actions never reaches here — this
 * route resolves the tenant directly from its own request's `Host` header.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const [lang, t] = await Promise.all([
    getLocale(),
    getTranslations('newsletterConfirm'),
  ]);
  const returnHomeLabel = t('returnHome');

  if (!token) {
    return new NextResponse(
      renderConfirmationPage({
        lang,
        title: t('invalidTitle'),
        message: t('invalidMessage'),
        returnHomeLabel,
      }),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  try {
    const host = request.headers.get('host');
    const tenantId = await resolveTenantId(host);
    if (!tenantId) {
      return new NextResponse(
        renderConfirmationPage({
          lang,
          title: t('errorTitle'),
          message: t('errorMessage'),
          returnHomeLabel,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }

    if (!(await isTenantActive(tenantId))) {
      logger.warn('newsletter.confirm_tenant_not_active', { tenantId });
      return new NextResponse(
        renderConfirmationPage({
          lang,
          title: t('errorTitle'),
          message: t('errorMessage'),
          returnHomeLabel,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }

    const result = await queries.subscribers.confirmSubscriber(tenantId, token);

    if (result.outcome === 'not-found') {
      return new NextResponse(
        renderConfirmationPage({
          lang,
          title: t('invalidTitle'),
          message: t('invalidMessage'),
          returnHomeLabel,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }

    return new NextResponse(
      renderConfirmationPage({
        lang,
        title: t('confirmedTitle'),
        message: t('confirmedMessage'),
        returnHomeLabel,
      }),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } catch (error) {
    logger.error('newsletter.confirm_failed', { error });
    return new NextResponse(
      renderConfirmationPage({
        lang,
        title: t('errorTitle'),
        message: t('errorMessage'),
        returnHomeLabel,
      }),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}
