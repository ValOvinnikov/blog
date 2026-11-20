import { CardList } from '@platform/components/shared/card-list';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import {
  SAMPLE_KIND,
  type TSampleKind,
} from '@platform/constants/sample-content';
import type { TKeptSample } from '@platform/server/sample-content/kept-sample';
import { hasArrayGotItems, isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { keptSamplesVariants } from './kept-samples-variants';

const SAMPLE_KIND_KEYS = {
  [SAMPLE_KIND.SECTION]: 'section',
  [SAMPLE_KIND.PAGE]: 'page',
  [SAMPLE_KIND.TEMPLATE]: 'template',
  [SAMPLE_KIND.LINK]: 'link',
  [SAMPLE_KIND.AUTHOR]: 'author',
  [SAMPLE_KIND.TOPIC]: 'topic',
  [SAMPLE_KIND.OTHER]: 'other',
} as const satisfies Record<TSampleKind, string>;

export type TKeptSamplesProps = {
  keptEdited: TKeptSample[];
  keptReferenced: TKeptSample[];
};

export const KeptSamples = ({
  keptEdited,
  keptReferenced,
}: TKeptSamplesProps) => {
  const t = useTranslations('ownerHomePage.sampleContent');
  const tKind = useTranslations('ownerHomePage.sampleContent.kind');
  const headingId = useId();
  const { root, group } = keptSamplesVariants();

  if (!hasArrayGotItems(keptEdited) && !hasArrayGotItems(keptReferenced)) {
    return <Text>{t('nothingKept')}</Text>;
  }

  const groups = [
    { key: 'keptEditedTitle', items: keptEdited },
    { key: 'keptReferencedTitle', items: keptReferenced },
  ] as const;

  return (
    <div className={root()}>
      {groups.map(
        ({ key, items }) =>
          hasArrayGotItems(items) && (
            <section
              key={key}
              aria-labelledby={`${headingId}-${key}`}
              className={group()}
            >
              <Heading level={3} size="cardTitle" id={`${headingId}-${key}`}>
                {t(key)}
              </Heading>
              <CardList
                items={items}
                emptyMessage={t('nothingKept')}
                renderRow={({ id, kind, title }) => {
                  const kindLabel = tKind(SAMPLE_KIND_KEYS[kind]);

                  return (
                    <CardList.Row key={id}>
                      <CardList.Primary>{title ?? kindLabel}</CardList.Primary>
                      {isUndefined(title) ? undefined : (
                        <CardList.Secondary>{kindLabel}</CardList.Secondary>
                      )}
                    </CardList.Row>
                  );
                }}
              />
            </section>
          ),
      )}
    </div>
  );
};
