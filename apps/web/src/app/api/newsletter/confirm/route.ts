import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { escapeXml } from '@web/utils/escape-xml';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

type TConfirmationPageCopy = {
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
function renderConfirmationPage({
  title,
  message,
  returnHomeLabel,
}: TConfirmationPageCopy): string {
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
}

/**
 * `GET /api/newsletter/confirm?token=…` — the double opt-in confirmation
 * link every newsletter confirmation email points at (#1044/#1104, design
 * doc Feature 5, D9). Flips the matching `subscribers` row from `pending` to
 * `active` via `queries.subscribers.confirmSubscriber` and renders a plain
 * result page — `confirmed`/`already-confirmed` both read as success (the
 * query's own idempotency guarantee), a missing/invalid token or a `?token=`-
 * less request reads as 400/404, and a db failure reads as 500. Sits under
 * `/api` (not `[locale]`) alongside this app's other Route Handlers
 * (`/api/account/export`, `/api/revalidate`) — none of them are locale-
 * prefixed, matching `localePrefix: 'never'`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const t = await getTranslations('newsletterConfirm');
  const returnHomeLabel = t('returnHome');

  if (!token) {
    return new NextResponse(
      renderConfirmationPage({
        title: t('invalidTitle'),
        message: t('invalidMessage'),
        returnHomeLabel,
      }),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  try {
    const result = await queries.subscribers.confirmSubscriber(token);

    if (result.outcome === 'not-found') {
      return new NextResponse(
        renderConfirmationPage({
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
        title: t('confirmedTitle'),
        message: t('confirmedMessage'),
        returnHomeLabel,
      }),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } catch (error) {
    console.error(
      'Failed to confirm newsletter subscription:',
      sanitizeLogMessage(error),
    );
    return new NextResponse(
      renderConfirmationPage({
        title: t('errorTitle'),
        message: t('errorMessage'),
        returnHomeLabel,
      }),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}
