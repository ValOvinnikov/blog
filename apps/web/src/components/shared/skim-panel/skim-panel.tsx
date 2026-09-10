import type { TMaybeUndefined } from '@blog/config';
import type { TPostSkim } from '@blog/service';
import { SwitchToReadButton } from '@web/components/shared/switch-to-read-button';
import { getTranslations } from 'next-intl/server';

import { skimPanelVariants } from './skim-panel-variants';

export interface ISkimPanelProps {
  skim: TMaybeUndefined<TPostSkim>;
}

const s = skimPanelVariants();

/**
 * SkimPanel — the `SKIM` depth's takeaways panel: a short bullet list plus
 * a "read the full article" affordance that switches back to `READ`. Stays
 * a server component (the one interactive bit lives in `SwitchToReadButton`,
 * per `web-component-practices`) and renders in the same static HTML as the
 * `READ`/`DEEP` body — CSS (`group-data-[depth=SKIM]/depth:flex`, keyed off
 * the nearest `DepthProvider` wrapper) is the only thing gating visibility,
 * so switching depth never re-fetches anything. Renders nothing when the
 * post has no approved skim.
 *
 * @example
 * <SkimPanel skim={post.skim} />
 */
export const SkimPanel = async ({ skim }: ISkimPanelProps) => {
  if (!skim) return null;

  const t = await getTranslations('blogPostPage');

  return (
    <section className={s.root()} aria-label={t('skimPanel.label')}>
      <ul className={s.list()}>
        {skim.takeaways.map((takeaway, index) => (
          // Index key is safe here: a static, once-rendered list (the
          // pipeline never reorders or filters takeaways in place) — and
          // avoids a collision if two generated takeaways are ever identical.
          <li key={index} className={s.item()}>
            {takeaway}
          </li>
        ))}
      </ul>
      <SwitchToReadButton label={t('skimPanel.readFullArticle')} />
    </section>
  );
};
