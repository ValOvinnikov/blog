import {
  at,
  createIfNotExists,
  patch,
  set,
  unset,
  type MigrationContext,
  type Mutation,
  type NodePatch,
} from 'sanity/migrate';

import {
  pagePlanKey,
  planTemplates,
  type TLayoutPage,
  type TPlannedTemplate,
  type TTemplateTypeByPageType,
  type TTranslationGroup,
} from './plan-templates';

const PAGES_QUERY =
  '*[_type in $types]{ _id, _type, language, title, hero, modules }';
const GROUPS_QUERY =
  '*[_type == "translation.metadata"]{ "pageIds": coalesce(translations[].value._ref, []) }';

export type TLayoutPageDocument = TLayoutPage & {
  template?: { _ref?: string };
};

const migratePage = (
  doc: TLayoutPageDocument,
  template: TPlannedTemplate | undefined,
): Mutation[] => {
  const patches: NodePatch[] = [];

  if (!doc.template && template) {
    patches.push(
      at('template', set({ _type: 'reference', _ref: template._id })),
    );
  }
  if (doc.hero !== undefined) patches.push(at('hero', unset()));
  if (doc.modules !== undefined) patches.push(at('modules', unset()));

  if (patches.length === 0) return [];

  const pagePatch = patch(doc._id, patches);

  return template && !doc.template
    ? [createIfNotExists(template), pagePatch]
    : [pagePatch];
};

export const moveLayoutIntoTemplates = (
  templateTypeByPageType: TTemplateTypeByPageType,
) => {
  const planCache = new WeakMap<
    MigrationContext,
    Promise<Map<string, TPlannedTemplate>>
  >();

  const getPlan = (context: MigrationContext) => {
    const cached = planCache.get(context);

    if (cached) return cached;

    const computed = Promise.all([
      context.client.fetch<TLayoutPage[]>(PAGES_QUERY, {
        types: Object.keys(templateTypeByPageType),
      }),
      context.client.fetch<TTranslationGroup[]>(GROUPS_QUERY),
    ]).then(([pages, groups]) =>
      planTemplates(pages, groups, templateTypeByPageType),
    );

    planCache.set(context, computed);

    return computed;
  };

  return async (
    doc: TLayoutPageDocument,
    context: MigrationContext,
  ): Promise<Mutation[]> => {
    const plan = await getPlan(context);

    return migratePage(doc, plan.get(pagePlanKey(doc._id)));
  };
};
