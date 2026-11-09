import { DocumentArticle } from '@web/components/page-templates/document-article';
import { COOKIE_STATEMENT_LOG } from '@web/constants/cookie-statement';
import { getCookieStatementPage } from '@web/server/cookie-statement/get-cookie-statement-page/get-cookie-statement-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

export const CookieStatementPage = async () => {
  const result = await getCookieStatementPage();
  const { headingBlock, headingAlignment, body } = guardPageLoaderResult(
    result,
    COOKIE_STATEMENT_LOG.PAGE_FETCH_FAILED,
  );

  return (
    <DocumentArticle
      headingBlock={headingBlock}
      headingAlignment={headingAlignment}
      body={body}
    />
  );
};
