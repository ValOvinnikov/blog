import { routes } from '@blog/config';
import { escapeXml } from '@web/utils/escape-xml';
import { NextResponse } from 'next/server';

export type TResultPageCopy = {
  title: string;
  message: string;
  returnHomeLabel: string;
};

export type TConfirmPageCopy = {
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

export const renderResultResponse = (
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
 * whose submit `POST`s to the same URL rather than acting on this `GET`.
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

export const renderConfirmResponse = (copy: TConfirmPageCopy): NextResponse => {
  return new NextResponse(renderConfirmPage(copy), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
