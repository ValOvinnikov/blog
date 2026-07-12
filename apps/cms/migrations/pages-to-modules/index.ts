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
 * Idempotency: both branches use a target-state guard — skip whenever
 * `modules` is already present on the document, regardless of whether the
 * legacy fields are also still present. This means a document that
 * (incorrectly) has both the old flat fields AND `modules` is left alone
 * rather than being re-wrapped or clobbered.
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
import { MODULE_TYPE } from '@blog/config/constants';
import { at, defineMigration, set, unset } from 'sanity/migrate';

type TLink = Record<string, unknown>;
type TImageWithAlt = Record<string, unknown>;
type TPostReference = { _type: 'reference'; _ref: string };

/**
 * Single source of truth for the `homePage` hero fields that move into
 * `module_hero`. The legacy document type, the module builder, and the
 * `unset()` list all derive from this array — add/remove a hero field here
 * only.
 */
const HERO_FIELDS = [
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

type THeroField = (typeof HERO_FIELDS)[number];

/** Value types for each legacy hero field, keyed the same as `HERO_FIELDS`. */
type THeroFieldValues = {
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

/** The `latestPosts*` → `module_postList` field rename (small, kept explicit). */
const LATEST_POSTS_FIELD_MAP = {
  latestPostsTitle: 'title',
  latestPostsLimit: 'limit',
} as const;

type TLegacyHomePage = THeroFieldValues & {
  latestPostsTitle?: string;
  latestPostsLimit?: number;
};

type TLegacyPage = {
  body?: unknown;
};

type TModuleHero = { _type: 'module_hero'; _key: string } & THeroFieldValues;

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

const buildHomePageModules = (
  doc: TLegacyHomePage,
): [TModuleHero, TModulePostList] => {
  const heroFields = Object.fromEntries(
    HERO_FIELDS.map((field) => [field, doc[field]]),
  ) as THeroFieldValues;

  const hero = withoutUndefined<TModuleHero>({
    _type: MODULE_TYPE.HERO,
    _key: 'hero',
    ...heroFields,
  });

  const postList = withoutUndefined<TModulePostList>({
    _type: MODULE_TYPE.POST_LIST,
    _key: 'postList',
    [LATEST_POSTS_FIELD_MAP.latestPostsTitle]: doc.latestPostsTitle,
    [LATEST_POSTS_FIELD_MAP.latestPostsLimit]: doc.latestPostsLimit,
  });

  return [hero, postList];
};

export default defineMigration({
  title: 'Wrap homePage hero/latest-posts and page.body into modules[]',
  documentTypes: ['homePage', 'page'],

  migrate: {
    document(doc) {
      const hasModules = (doc as { modules?: unknown }).modules !== undefined;

      if (doc._type === 'homePage') {
        // Idempotent: skip once the target shape (modules[]) is present, so a
        // re-run never rebuilds/overwrites real content — even if legacy
        // fields are also still present on the document.
        if (hasModules) {
          return undefined;
        }

        const homePage = doc as unknown as TLegacyHomePage;
        const modules = buildHomePageModules(homePage);

        return [
          at('modules', set(modules)),
          ...(HERO_FIELDS as readonly THeroField[]).map((field) =>
            at(field, unset()),
          ),
          ...Object.keys(LATEST_POSTS_FIELD_MAP).map((field) =>
            at(field, unset()),
          ),
        ];
      }

      if (doc._type === 'page') {
        // Idempotent: same target-state guard as `homePage` — skip once
        // `modules` exists, even if `body` is also still present.
        if (hasModules) {
          return undefined;
        }

        const page = doc as unknown as TLegacyPage;

        if (page.body === undefined) return undefined;

        const content = withoutUndefined<TModuleContent>({
          _type: MODULE_TYPE.CONTENT,
          _key: 'content',
          body: page.body,
        });

        return [at('modules', set([content])), at('body', unset())];
      }

      return undefined;
    },
  },
});
