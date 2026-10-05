import {
  at,
  createIfNotExists,
  defineMigration,
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
  type TTranslationGroup,
} from './plan-templates';

const PAGE_TYPES = ['page_home', 'page_landing'];
const TEMPLATE_TYPE = 'page_template';

const PAGES_QUERY = '*[_type in $types]{ _id, language, title, hero, modules }';
const GROUPS_QUERY =
  '*[_type == "translation.metadata"]{ "pageIds": coalesce(translations[].value._ref, []) }';

const planCache = new WeakMap<
  MigrationContext,
  Promise<Map<string, TPlannedTemplate>>
>();

const getPlan = (context: MigrationContext) => {
  const cached = planCache.get(context);

  if (cached) return cached;

  const computed = Promise.all([
    context.client.fetch<TLayoutPage[]>(PAGES_QUERY, { types: PAGE_TYPES }),
    context.client.fetch<TTranslationGroup[]>(GROUPS_QUERY),
  ]).then(([pages, groups]) => planTemplates(pages, groups));

  planCache.set(context, computed);

  return computed;
};

type TPageDoc = TLayoutPage & { template?: { _ref?: string } };

const migratePage = (
  doc: TPageDoc,
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
    ? [createIfNotExists({ _type: TEMPLATE_TYPE, ...template }), pagePatch]
    : [pagePatch];
};

export const migratePageDocument = async (
  doc: TPageDoc,
  context: MigrationContext,
): Promise<Mutation[]> => {
  const plan = await getPlan(context);

  return migratePage(doc, plan.get(pagePlanKey(doc._id)));
};

export default defineMigration({
  title: 'Move Landing and Home hero and modules into shared page templates',
  documentTypes: PAGE_TYPES,
  migrate: {
    document(doc, context) {
      return migratePageDocument(doc as unknown as TPageDoc, context);
    },
  },
});
