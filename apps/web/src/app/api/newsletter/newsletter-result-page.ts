import { routes } from '@blog/config';
import { escapeXml } from '@web/utils/escape-xml';
import { NextResponse } from 'next/server';

export type TResultPageCopy = {
  lang: string;
  title: string;
  message: string;
  returnHomeLabel: string;
};

const renderResultPage = ({
  lang,
  title,
  message,
  returnHomeLabel,
}: TResultPageCopy): string => {
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

export const renderResultResponse = (
  copy: TResultPageCopy,
  status: number,
): NextResponse => {
  return new NextResponse(renderResultPage(copy), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
