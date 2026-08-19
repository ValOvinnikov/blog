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
 * post's body copy, set visually apart from the surrounding prose so a
 * reader in the deep-dive depth can tell at a glance that it's supplementary
 * rather than part of the main argument. `kind` identifies which flavour of
 * digression it is (why-not, tangent, background context); the human-
 * readable `label` for that kind is supplied by the caller, never derived
 * here. `children` is the already-rendered body content (e.g. Portable Text
 * output from `apps/web`).
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
