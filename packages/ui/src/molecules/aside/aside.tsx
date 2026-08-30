import type { IWithClassName, IWithDataTestId, TAsideKind } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import type { ReactNode } from 'react';

import { asideVariants } from './aside-variants';

export type TAsideProps = IWithClassName &
  IWithDataTestId & {
    kind: TAsideKind;
    label: string;
    children: ReactNode;
  };

const s = asideVariants();

/**
 * Aside molecule — an inline deep-dive digression rendered alongside a
 * post's body copy, visually set apart from the surrounding prose. `kind`
 * selects which flavour of digression it is; `label` and `children` are
 * supplied by the caller.
 *
 * @example
 * <Aside kind={ASIDE_KIND.DIGRESSION} label="Digression">
 *   <p>...</p>
 * </Aside>
 */
export const Aside = ({
  kind,
  label,
  children,
  className,
  dataTestId,
}: TAsideProps) => (
  <aside
    role="note"
    aria-label={label}
    data-kind={kind}
    className={s.root({ class: className })}
    data-testid={dataTestId}
  >
    <Eyebrow className={s.label()}>{label}</Eyebrow>
    <div className={s.body()}>{children}</div>
  </aside>
);
