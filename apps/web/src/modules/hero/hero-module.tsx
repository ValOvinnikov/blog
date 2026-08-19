import { service } from '@blog/service';
import { env } from '@web/utils/env/env';

import { HeroModuleView } from './hero-module-view';

export interface IHeroModuleProps {
  id: string;
  locale: string;
}

/**
 * HeroModule — fetches `module_hero` data and hands it to `HeroModuleView`.
 * The only place this module's service and ui meet.
 */
export async function HeroModule({ id }: IHeroModuleProps) {
  const result = await service.modules.hero.v1.getHero(id);

  if (!result.ok) return null;

  const { title } = result.data;

  // No title resolved from CMS config or fallback featured post — never
  // render a Hero with an empty top-level <h1>.
  if (!title) return null;

  return (
    <HeroModuleView
      id={id}
      {...result.data}
      title={title}
      projectId={env.NEXT_PUBLIC_SANITY_PROJECT_ID}
      dataset={env.NEXT_PUBLIC_SANITY_DATASET}
    />
  );
}
