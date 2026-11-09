import type { TSectionDocumentType } from '@blog/service';
import { DocumentArticle } from '@web/components/page-templates/document-article';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { getSectionDocumentPage } from '@web/server/section-document/get-section-document-page/get-section-document-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

type TSectionDocumentPageProps = {
  type: TSectionDocumentType;
  slug: string;
};

export const SectionDocumentPage = async ({
  type,
  slug,
}: TSectionDocumentPageProps) => {
  const result = await getSectionDocumentPage(type, slug);
  const { title, body } = guardPageLoaderResult(
    result,
    SECTION_DOCUMENT_LOG.PAGE_FETCH_FAILED,
    { type, slug },
  );

  return <DocumentArticle title={title} body={body} />;
};
