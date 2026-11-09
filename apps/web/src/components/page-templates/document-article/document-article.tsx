import type { TPortableTextBody } from '@blog/service';
import { Prose } from '@blog/ui/components/atoms/prose';
import { Article } from '@blog/ui/components/organisms/article';
import { ContentsRailLayout } from '@web/components/shared/contents-rail-layout';
import { PortableText } from '@web/components/shared/portable-text';

import { documentArticleVariants } from './document-article-variants';

type TDocumentArticleProps = {
  title: string;
  body: TPortableTextBody;
};

const s = documentArticleVariants();

export const DocumentArticle = ({ title, body }: TDocumentArticleProps) => {
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
