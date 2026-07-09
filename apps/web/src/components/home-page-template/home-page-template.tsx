import type { ReactNode } from 'react';

import { homePageTemplateVariants } from './home-page-template-variants';

export interface IHomePageTemplateProps {
  hero: ReactNode;
  latestPosts: ReactNode;
}

/**
 * HomePageTemplate — the home route's page-level shell, composing the hero
 * and latest-posts sections inside the shared page shell. `Header`/`Footer`
 * stay owned by `layout.tsx`; this template only wires the two route-specific
 * slots.
 */
export const HomePageTemplate = ({
  hero,
  latestPosts,
}: IHomePageTemplateProps) => (
  <main className={homePageTemplateVariants()}>
    {hero}
    {latestPosts}
  </main>
);
