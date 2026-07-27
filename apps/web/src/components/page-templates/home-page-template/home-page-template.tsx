import type { ReactNode } from 'react';

import { homePageTemplateVariants } from './home-page-template-variants';

export interface IHomePageTemplateProps {
  hero: ReactNode;
  modules: ReactNode;
}

/**
 * HomePageTemplate — the home route's page-level shell, composing the
 * dedicated hero module and the rendered module list inside the shared page
 * shell. `Header`/`Footer` stay owned by `layout.tsx`; this template only
 * wires the two route-specific slots.
 */
export const HomePageTemplate = ({ hero, modules }: IHomePageTemplateProps) => (
  <main className={homePageTemplateVariants()}>
    {hero}
    {modules}
  </main>
);
