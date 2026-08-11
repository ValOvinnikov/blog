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
 * shell. Both `hero` and `modules` render full-bleed as direct children of
 * `<main>` (no constraining wrapper) — each module owns its own full-bleed
 * background and constrained content via `Section`. `Header`/`Footer` stay
 * owned by `layout.tsx`; this template only wires the two route-specific
 * slots.
 */
export const HomePageTemplate = ({ hero, modules }: IHomePageTemplateProps) => (
  <main className={s.root()}>
    {hero}
    {modules}
  </main>
);
