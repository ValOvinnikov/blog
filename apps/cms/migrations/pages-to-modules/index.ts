/**
 * Wrap `homePage`'s flat hero/latest-posts fields, and `page.body`, into the
 * new `modules[]` array (Phase 5 — page template + modules[] + module_hero).
 * Run AFTER the schema change (see schema-types/modules/*, homePage, page) +
 * `pnpm typegen`.
 *
 * Transforms (per-document, no cross-document dereference):
 *   - `homePage`: builds `modules = [module_hero, module_postList]` from the
 *     existing flat fields (`featuredPost`, `heroEyebrowMode`…`heroImage`,
 *     `primaryActionLabel`, `secondaryAction` → `module_hero`;
 *     `latestPostsTitle`/`latestPostsLimit` → `module_postList.title`/`limit`),
 *     `set`s `modules`, then `unset`s every moved flat field. Fields that are
 *     undefined on the source document are simply omitted from the module
 *     object (not set as `undefined` keys).
 *   - `page`: wraps `body` into `modules = [{ _type: 'module_content', body }]`,
 *     `set`s `modules`, `unset`s `body`.
 *
 * The rendered output does not change — the service layer re-projects
 * `modules[]` back into the existing `THomePage` view-model (see
 * packages/service/src/features/pages/home/adaptor/{query,transformer}.ts,
 * Phase 5 Task 3, done separately from this cms-layer migration).
 *
 * Workflow (see ../README.md for full guardrails):
 *   1. pnpm --filter cms dataset:export -- migrations/backups/production-pre-modules.tar.gz
 *   2. pnpm --filter cms migrate:dry -- pages-to-modules
 *   3. Inspect the dry-run diff carefully.
 *   4. Only then: pnpm --filter cms migrate:run -- pages-to-modules
 *      (human-gated — an agent must not run this step)
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

type TLink = Record<string, unknown>;
type TImageWithAlt = Record<string, unknown>;
type TPostReference = { _type: 'reference'; _ref: string };

type TLegacyHomePage = {
  featuredPost?: TPostReference;
  heroEyebrowMode?: string;
  heroEyebrow?: string;
  heroTitleMode?: string;
  heroTitle?: string;
  heroSubtitleMode?: string;
  heroSubtitle?: string;
  heroImageMode?: string;
  heroImage?: TImageWithAlt;
  primaryActionLabel?: string;
  secondaryAction?: TLink;
  latestPostsTitle?: string;
  latestPostsLimit?: number;
};

type TLegacyPage = {
  body?: unknown;
};

type TModuleHero = {
  _type: 'module_hero';
  _key: string;
  featuredPost?: TPostReference;
  heroEyebrowMode?: string;
  heroEyebrow?: string;
  heroTitleMode?: string;
  heroTitle?: string;
  heroSubtitleMode?: string;
  heroSubtitle?: string;
  heroImageMode?: string;
  heroImage?: TImageWithAlt;
  primaryActionLabel?: string;
  secondaryAction?: TLink;
};

type TModulePostList = {
  _type: 'module_postList';
  _key: string;
  title?: string;
  limit?: number;
};

type TModuleContent = {
  _type: 'module_content';
  _key: string;
  body?: unknown;
};

/** Omits keys whose value is `undefined` so `set()` never writes an undefined key. */
const withoutUndefined = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;

const HOME_HERO_FIELDS = [
  'featuredPost',
  'heroEyebrowMode',
  'heroEyebrow',
  'heroTitleMode',
  'heroTitle',
  'heroSubtitleMode',
  'heroSubtitle',
  'heroImageMode',
  'heroImage',
  'primaryActionLabel',
  'secondaryAction',
] as const;

const HOME_LATEST_POSTS_FIELDS = [
  'latestPostsTitle',
  'latestPostsLimit',
] as const;

const buildHomePageModules = (
  doc: TLegacyHomePage,
): [TModuleHero, TModulePostList] => {
  const hero = withoutUndefined<TModuleHero>({
    _type: 'module_hero',
    _key: 'hero',
    featuredPost: doc.featuredPost,
    heroEyebrowMode: doc.heroEyebrowMode,
    heroEyebrow: doc.heroEyebrow,
    heroTitleMode: doc.heroTitleMode,
    heroTitle: doc.heroTitle,
    heroSubtitleMode: doc.heroSubtitleMode,
    heroSubtitle: doc.heroSubtitle,
    heroImageMode: doc.heroImageMode,
    heroImage: doc.heroImage,
    primaryActionLabel: doc.primaryActionLabel,
    secondaryAction: doc.secondaryAction,
  });

  const postList = withoutUndefined<TModulePostList>({
    _type: 'module_postList',
    _key: 'postList',
    title: doc.latestPostsTitle,
    limit: doc.latestPostsLimit,
  });

  return [hero, postList];
};

export default defineMigration({
  title: 'Wrap homePage hero/latest-posts and page.body into modules[]',
  documentTypes: ['homePage', 'page'],

  migrate: {
    document(doc) {
      if (doc._type === 'homePage') {
        // Idempotent: skip if already migrated (modules[] present), so a re-run
        // never rebuilds empty modules and overwrites the real content.
        if ((doc as { modules?: unknown }).modules !== undefined) {
          return undefined;
        }

        const homePage = doc as unknown as TLegacyHomePage;
        const modules = buildHomePageModules(homePage);

        return [
          at('modules', set(modules)),
          ...HOME_HERO_FIELDS.map((field) => at(field, unset())),
          ...HOME_LATEST_POSTS_FIELDS.map((field) => at(field, unset())),
        ];
      }

      if (doc._type === 'page') {
        const page = doc as unknown as TLegacyPage;

        if (page.body === undefined) return undefined;

        const content = withoutUndefined<TModuleContent>({
          _type: 'module_content',
          _key: 'content',
          body: page.body,
        });

        return [at('modules', set([content])), at('body', unset())];
      }

      return undefined;
    },
  },
});
