import type { TAsideKind } from '@blog/config';
import { Aside } from '@blog/ui/molecules/aside';
import type { ReactNode } from 'react';

import { deepAsideVariants } from './deep-aside-variants';

export interface IDeepAsideProps {
  kind: TAsideKind;
  /** Translated label for `kind` — supplied by the caller (`PortableTextRenderer`). */
  label: string;
  children: ReactNode;
}

const s = deepAsideVariants();

/**
 * DeepAside — wraps `@blog/ui`'s `Aside` molecule in the CSS gate that
 * limits it to the `DEEP` reading depth. No client-side JS: visibility is
 * driven entirely by the nearest `DepthProvider` wrapper's `data-depth`
 * attribute via a `group-data-[depth=DEEP]/depth` selector, so it renders
 * server-side in the same static HTML at every depth.
 *
 * @example
 * <DeepAside kind={ASIDE_KIND.DIGRESSION} label={t('asideKind.DIGRESSION')}>
 *   <PortableText value={aside.body} components={components} />
 * </DeepAside>
 */
export const DeepAside = ({ kind, label, children }: IDeepAsideProps) => (
  <div className={s.root()}>
    <Aside kind={kind} label={label}>
      {children}
    </Aside>
  </div>
);
