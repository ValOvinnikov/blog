import {
  routes,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import type { TTranslationMap } from '@blog/service';

type TListPage = {
  href: string;
  languages: readonly TLocaleIsoCode[];
};

export const findListPage = (
  segment: string,
  translationMap: TTranslationMap,
): TMaybeUndefined<TListPage> => {
  switch (segment) {
    case 'blog':
      return {
        href: routes.blogIndex(),
        languages: translationMap.postIndexLanguages,
      };
    case 'topics':
      return {
        href: routes.topics(),
        languages: translationMap.topicIndexLanguages,
      };
    case 'tags':
      return {
        href: routes.tags(),
        languages: translationMap.tagIndexLanguages,
      };
    default:
      return undefined;
  }
};
