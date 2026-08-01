import type { TMaybeUndefined } from '@blog/config';
import type { TPostSkim } from '@blog/service';
import { SwitchToReadButton } from '@web/components/shared/switch-to-read-button';

import { skimPanelVariants } from './skim-panel-variants';

export interface ISkimPanelProps {
  skim: TMaybeUndefined<TPostSkim>;
  /** Panel's accessible label (e.g. "30-second summary"). */
  label: string;
  /** Copy for the "read the full article" affordance. */
  readFullArticleLabel: string;
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
 * <SkimPanel skim={post.skim} label={t('skimPanel.label')} readFullArticleLabel={t('skimPanel.readFullArticle')} />
 */
export const SkimPanel = ({
  skim,
  label,
  readFullArticleLabel,
}: ISkimPanelProps) => {
  if (!skim) return null;

  return (
    <section className={s.root()} aria-label={label}>
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
      <SwitchToReadButton label={readFullArticleLabel} />
    </section>
  );
};
