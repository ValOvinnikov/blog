import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { withPrefix } from './with-prefix';

// Every tenant's default language is English when this runs.
const DEFAULT_LOCALE = LOCALE_ISO_CODES.EN;
const DRAFTS_PREFIX = 'drafts.';
const TEMPLATE_PREFIX = 'template-';

export type TLayoutPage = {
  _id: string;
  _type: string;
  language?: string;
  title?: string;
  hero?: unknown;
  modules?: unknown;
};

export type TTranslationGroup = { pageIds: string[] };

export type TTemplateTypeByPageType = Record<string, string>;

export type TPlannedTemplate = {
  _id: string;
  _type: string;
  title?: string;
  hero?: unknown;
  modules?: unknown;
};

const bareId = (id: string) =>
  id.startsWith(DRAFTS_PREFIX) ? id.slice(DRAFTS_PREFIX.length) : id;

const isDefaultLanguage = (page: TLayoutPage) =>
  (page.language ?? DEFAULT_LOCALE) === DEFAULT_LOCALE;

const pickSource = (versions: TLayoutPage[]) =>
  versions.find((page) => !page._id.startsWith(DRAFTS_PREFIX)) ?? versions[0];

/** Maps every page's bare id to the one template its translation group shares. */
export const planTemplates = (
  pages: TLayoutPage[],
  groups: TTranslationGroup[],
  templateTypeByPageType: TTemplateTypeByPageType,
): Map<string, TPlannedTemplate> => {
  const versionsById = new Map<string, TLayoutPage[]>();

  for (const page of pages) {
    const id = bareId(page._id);
    versionsById.set(id, [...(versionsById.get(id) ?? []), page]);
  }

  const groupOf = new Map<string, string[]>();

  for (const { pageIds } of groups) {
    const members = pageIds.map(bareId).filter((id) => versionsById.has(id));
    for (const id of members) {
      if (!groupOf.has(id)) groupOf.set(id, members);
    }
  }

  const plan = new Map<string, TPlannedTemplate>();

  for (const id of [...versionsById.keys()].sort()) {
    if (plan.has(id)) continue;

    const members = [...(groupOf.get(id) ?? [id])].sort();
    const sources = members.map((member) =>
      pickSource(versionsById.get(member) ?? []),
    );
    const source =
      sources.find((page) => page && isDefaultLanguage(page)) ?? sources[0];

    const templateType = source && templateTypeByPageType[source._type];

    if (!source || !templateType) continue;

    const template: TPlannedTemplate = {
      _id: withPrefix(bareId(source._id), TEMPLATE_PREFIX),
      _type: templateType,
      title: source.title,
      hero: source.hero,
      modules: source.modules,
    };

    for (const member of members) plan.set(member, template);
  }

  return plan;
};

export const pagePlanKey = bareId;
