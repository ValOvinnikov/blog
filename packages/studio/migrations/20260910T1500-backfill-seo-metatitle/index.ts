/**
 * Backfills `seo.metaTitle` for every page document that lacks one, ahead of
 * `metaTitle` becoming `required()` in `../../src/schema-types/objects/seo.ts`
 * — without this, every existing document missing the field becomes
 * unpublishable the moment that validation lands.
 *
 * Runs against `page_home`, `page_blog`, `page_tagIndex`, `page_topicIndex`,
 * `page_tag`, `page_topic`, `page_post` and `page_landing` (published and
 * draft ids alike — no `documentTypes` filter narrows by draft status, so
 * both are visited):
 *
 *   - `page_post`: `headingBlock.heading` is required on every post, so it's
 *     always available as the title's subject.
 *   - `page_home` / `page_blog` / `page_tagIndex` / `page_topicIndex`:
 *     singletons whose own heading is a bare word ("Home", "Blog", "Tags",
 *     "Topics") — paired with the `settings_site` tagline (or description) for
 *     real padding.
 *   - `page_tag` / `page_topic`: subject is the page's own
 *     `headingBlock.heading` when authored, else the referenced
 *     `blog_tag`/`blog_topic` title, paired with the site brand name.
 *   - `page_landing`: not a singleton — subject is the page's own
 *     `headingBlock.heading`, paired with the site brand name like a post.
 *
 * Every document type may also carry a `hero` reference in place of
 * `headingBlock.heading` (see `validateHeroOrHeading`); this migration only
 * backfills from an authored heading and skips a hero-only document, same as
 * it skips any other document with no usable subject.
 *
 * See `./build-meta-title.ts` for the pure title construction and its tests.
 *
 * Idempotency guard: skips any document whose `seo.metaTitle` is already
 * set — an authored title is never touched or overwritten, and a document
 * already backfilled by a prior run is a no-op on every later run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * the schema change that makes `seo.metaTitle` required.
 */
import {
  at,
  defineMigration,
  set,
  setIfMissing,
  type MigrationContext,
  type NodePatch,
} from 'sanity/migrate';

import {
  buildEntityPageMetaTitle,
  buildHeadingMetaTitle,
  buildIndexPageMetaTitle,
} from './build-meta-title';

const PAGE_HOME_TYPE = 'page_home';
const PAGE_BLOG_TYPE = 'page_blog';
const PAGE_TAG_INDEX_TYPE = 'page_tagIndex';
const PAGE_TOPIC_INDEX_TYPE = 'page_topicIndex';
const PAGE_TAG_TYPE = 'page_tag';
const PAGE_TOPIC_TYPE = 'page_topic';
const PAGE_POST_TYPE = 'page_post';
const PAGE_LANDING_TYPE = 'page_landing';

const SETTINGS_SITE_ID = 'settings_site';

type TPageDoc = {
  _id: string;
  _type: string;
  seo?: { metaTitle?: string };
  headingBlock?: { heading?: string };
  tag?: { _ref?: string };
  topic?: { _ref?: string };
};

type TSettingsSiteDoc = {
  brand?: { name?: string };
  tagline?: string;
  description?: string;
};

type TEntityDoc = { title?: string };

/**
 * Keyed by `context` (one stable object per migration run) rather than a
 * plain module-level variable — a plain variable would leak one run's
 * `settings_site` fetch into every later run sharing the same process.
 */
const settingsSiteCache = new WeakMap<
  MigrationContext,
  Promise<TSettingsSiteDoc | undefined>
>();

const getSettingsSite = (
  context: MigrationContext,
): Promise<TSettingsSiteDoc | undefined> => {
  const cached = settingsSiteCache.get(context);

  if (cached) return cached;

  const computed =
    context.client.getDocument<TSettingsSiteDoc>(SETTINGS_SITE_ID);

  settingsSiteCache.set(context, computed);

  return computed;
};

const resolvePadText = (settings: TSettingsSiteDoc | undefined): string =>
  settings?.tagline?.trim() || settings?.description?.trim() || '';

const resolveEntityTitle = async (
  context: MigrationContext,
  ref: string | undefined,
): Promise<string | undefined> => {
  if (!ref) return undefined;

  const entity = await context.client.getDocument<TEntityDoc>(ref);

  return entity?.title?.trim() || undefined;
};

const toMetaTitleMutations = (metaTitle: string): NodePatch[] => [
  at('seo', setIfMissing({})),
  at('seo.metaTitle', set(metaTitle)),
];

export default defineMigration({
  title: 'Backfill seo.metaTitle for pages that lack one',
  documentTypes: [
    PAGE_HOME_TYPE,
    PAGE_BLOG_TYPE,
    PAGE_TAG_INDEX_TYPE,
    PAGE_TOPIC_INDEX_TYPE,
    PAGE_TAG_TYPE,
    PAGE_TOPIC_TYPE,
    PAGE_POST_TYPE,
    PAGE_LANDING_TYPE,
  ],

  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TPageDoc;

      if (doc.seo?.metaTitle) return [];

      const heading = doc.headingBlock?.heading?.trim() || undefined;

      switch (doc._type) {
        case PAGE_HOME_TYPE:
        case PAGE_BLOG_TYPE:
        case PAGE_TAG_INDEX_TYPE:
        case PAGE_TOPIC_INDEX_TYPE: {
          if (!heading) return [];

          const settings = await getSettingsSite(context);
          const padText = resolvePadText(settings);
          const brandName = settings?.brand?.name?.trim();

          const metaTitle = buildIndexPageMetaTitle(
            heading,
            padText,
            brandName,
          );

          if (!metaTitle) return [];

          return toMetaTitleMutations(metaTitle);
        }

        case PAGE_TAG_TYPE:
        case PAGE_TOPIC_TYPE: {
          const entityRef =
            doc._type === PAGE_TAG_TYPE ? doc.tag?._ref : doc.topic?._ref;
          const subject =
            heading ?? (await resolveEntityTitle(context, entityRef));

          if (!subject) return [];

          const settings = await getSettingsSite(context);
          const brandName = settings?.brand?.name?.trim();

          if (!brandName) return [];

          const padText = resolvePadText(settings);
          const metaTitle = buildEntityPageMetaTitle(
            subject,
            brandName,
            padText,
          );

          if (!metaTitle) return [];

          return toMetaTitleMutations(metaTitle);
        }

        case PAGE_POST_TYPE:
        case PAGE_LANDING_TYPE: {
          if (!heading) return [];

          const settings = await getSettingsSite(context);
          const brandName = settings?.brand?.name?.trim();

          if (!brandName) return [];

          const padText = resolvePadText(settings);
          const metaTitle = buildHeadingMetaTitle(heading, brandName, padText);

          if (!metaTitle) return [];

          return toMetaTitleMutations(metaTitle);
        }

        default:
          return [];
      }
    },
  },
});
