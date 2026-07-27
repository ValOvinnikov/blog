import type { ReactNode } from 'react';

import { homePageTemplateVariants } from './home-page-template-variants';

export interface IHomePageTemplateProps {
  hero: ReactNode;
  modules: ReactNode;
}

const s = homePageTemplateVariants();

/**
 * HomePageTemplate — the home route's page-level shell, composing the
 * dedicated hero module and the rendered module list inside the shared page
 * shell. `hero` renders full-bleed as a direct child of `<main>` (no
 * constraining wrapper) so it sits flush against the sticky `Header` and can
 * span the full viewport width; `modules` renders inside the constrained,
 * aligned container the whole shell used to use. `Header`/`Footer` stay
 * owned by `layout.tsx`; this template only wires the two route-specific
 * slots.
 */
export const HomePageTemplate = ({ hero, modules }: IHomePageTemplateProps) => (
  <main className={s.root()}>
    {hero}
    <div className={s.modules()}>{modules}</div>
  </main>
);
