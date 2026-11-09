import type { ArticleText } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { articleTextMemberProjections } from '@blog/service/shared/fragments/portable-text/article-text-member';
import { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';

export const portableTextBodyItemFragment = q
  .fragment<ArticleText[number]>()
  .project((sub) => ({
    '...': true,
    ...sub.conditionalByType({
      ...articleTextMemberProjections,
      expandableSection: (sectionSub) => ({
        '...': true,
        body: sectionSub
          .field('body[]')
          .project((itemSub) => ({
            '...': true,
            ...itemSub.conditionalByType(articleTextMemberProjections),
          }))
          .nullable(true),
      }),
      table: (tableSub) => ({
        '...': true,
        rows: tableSub
          .field('rows[]')
          .project((rowSub) => ({
            '...': true,
            cells: rowSub
              .field('cells[]')
              .project((cellSub) => ({
                '...': true,
                value: cellSub
                  .field('value[]')
                  .project(textBlockFragment)
                  .nullable(true),
              }))
              .nullable(true),
          }))
          .nullable(true),
      }),
    }),
  }));
