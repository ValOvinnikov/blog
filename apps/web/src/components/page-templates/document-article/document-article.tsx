import type {
  TContentAlignment,
  THeadingBlock,
  TMaybeUndefined,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { Prose } from '@blog/ui/components/atoms/prose';
import { Article } from '@blog/ui/components/organisms/article';
import { ContentsRailLayout } from '@web/components/shared/contents-rail-layout';
import { PageHeading } from '@web/components/shared/page-heading';
import { PortableText } from '@web/components/shared/portable-text';

import { documentArticleVariants } from './document-article-variants';

type TDocumentArticleProps = {
  headingBlock: TMaybeUndefined<THeadingBlock>;
  headingAlignment: TContentAlignment;
  body: TPortableTextBody;
};

const s = documentArticleVariants();

export const DocumentArticle = ({
  headingBlock,
  headingAlignment,
  body,
}: TDocumentArticleProps) => {
  return (
    <main className={s.root()}>
      {headingBlock ? (
        <PageHeading headingBlock={headingBlock} align={headingAlignment} />
      ) : null}
      <Article>
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
