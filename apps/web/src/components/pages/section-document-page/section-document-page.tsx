import type { TSectionDocumentType } from '@blog/service';
import { Prose } from '@blog/ui/components/atoms/prose';
import { Article } from '@blog/ui/components/organisms/article';
import { ContentsRailLayout } from '@web/components/shared/contents-rail-layout';
import { PortableText } from '@web/components/shared/portable-text';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { getSectionDocumentPage } from '@web/server/section-document/get-section-document-page/get-section-document-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { sectionDocumentPageVariants } from './section-document-page-variants';

type TSectionDocumentPageProps = {
  type: TSectionDocumentType;
  slug: string;
};

const s = sectionDocumentPageVariants();

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

  return (
    <main className={s.root()}>
      <Article>
        <Article.Header className={s.header()} title={title} />
        <Article.Body className={s.body()}>
          <ContentsRailLayout body={body}>
            <Prose className={s.prose()}>
              <PortableText value={body} />
            </Prose>
          </ContentsRailLayout>
        </Article.Body>
      </Article>
    </main>
  );
};
