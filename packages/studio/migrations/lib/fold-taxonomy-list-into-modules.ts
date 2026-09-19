import { at, prepend, setIfMissing, type NodePatch } from 'sanity/migrate';

const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';

type TModuleReference = { _key: string; _type: string; _ref: string };

export type TTaxonomyListFoldSource = {
  taxonomyList?: { _ref?: string };
  modules?: TModuleReference[];
};

export const toTaxonomyListModuleKey = (ref: string): string =>
  `taxonomyList-${ref}`;

export const foldTaxonomyListIntoModules = (
  doc: TTaxonomyListFoldSource,
): NodePatch[] | undefined => {
  const ref = doc.taxonomyList?._ref;

  if (!ref) return undefined;

  const alreadyReferenced = (doc.modules ?? []).some(
    (module) => module._ref === ref,
  );

  if (alreadyReferenced) return undefined;

  return [
    at('modules', setIfMissing([])),
    at(
      'modules',
      prepend([
        {
          _key: toTaxonomyListModuleKey(ref),
          _type: TAXONOMY_LIST_MODULE_TYPE,
          _ref: ref,
        },
      ]),
    ),
  ];
};
