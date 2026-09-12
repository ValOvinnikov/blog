/**
 * Backfills `headingBlock.heading` for every document that lacks one, ahead
 * of the field becoming required — without this, every existing document
 * missing it becomes unpublishable (and, once the service layer's
 * `.notNull()` lands, 404s the page it renders) the moment that validation
 * ships.
 *
 * Derivation per type:
 *   - `page_tag`: the referenced `blog_tag`'s own `title`.
 *   - `page_topic`: the referenced `blog_topic`'s own `title`.
 *   - `page_home`: the page's own `hero` reference's title field — whichever
 *     one its type carries (`heroTitle` on `module_hero`, `heading` on
 *     `module_heroBlog`).
 *   - `module_postList`: the term title of whichever page owns it (the
 *     `page_tag`/`page_topic` whose `modules[]` references this list), or
 *     — for the one list with no term, the site-wide archive — `page_blog`'s
 *     own `headingBlock.heading`.
 *
 * A handful of other types lack a heading with no derivable source at all
 * (their only candidate is the internal Studio `title`, a non-rendered
 * label) and are authored by hand instead — this migration's
 * `documentTypes` excludes them outright, so it never touches or invents
 * copy for them.
 *
 * A document whose derived source turns out empty or unreachable is skipped
 * and reported to stderr rather than given invented copy.
 *
 * Idempotency guard: skips any document whose `headingBlock.heading` is
 * already set — an authored heading is never touched or overwritten, and a
 * document already backfilled by a prior run is a no-op on every later run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff, and the
 *      console warnings for any document that had no clean source
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import {
  at,
  defineMigration,
  set,
  setIfMissing,
  type MigrationContext,
  type NodePatch,
} from 'sanity/migrate';

const PAGE_TAG_TYPE = 'page_tag';
const PAGE_TOPIC_TYPE = 'page_topic';
const PAGE_HOME_TYPE = 'page_home';
const PAGE_BLOG_TYPE = 'page_blog';
const MODULE_POST_LIST_TYPE = 'module_postList';

const MODULE_HERO_TYPE = 'module_hero';
const MODULE_HERO_BLOG_TYPE = 'module_heroBlog';

const DRAFTS_PREFIX = 'drafts.';

type THeadingBlockDoc = {
  _id: string;
  _type: string;
  headingBlock?: { heading?: string };
};

type TPageTagDoc = THeadingBlockDoc & { tag?: { _ref?: string } };
type TPageTopicDoc = THeadingBlockDoc & { topic?: { _ref?: string } };
type TPageHomeDoc = THeadingBlockDoc & { hero?: { _ref?: string } };

type TEntityDoc = { title?: string };
type THeroDoc = { _type?: string; heroTitle?: string; heading?: string };
type TOwningPageDoc = {
  _type?: string;
  tag?: { _ref?: string };
  topic?: { _ref?: string };
  headingBlock?: { heading?: string };
};

export const toHeadingMutations = (heading: string): NodePatch[] => [
  at('headingBlock', setIfMissing({})),
  at('headingBlock.heading', set(heading)),
];

export const toPublishedId = (id: string): string =>
  id.startsWith(DRAFTS_PREFIX) ? id.slice(DRAFTS_PREFIX.length) : id;

export const resolveEntityTitle = async (
  context: MigrationContext,
  ref: string | undefined,
): Promise<string | undefined> => {
  if (!ref) return undefined;

  const entity = await context.client.fetch<TEntityDoc | null>(
    '*[_id == $ref][0]{ title }',
    { ref },
  );

  return entity?.title?.trim() || undefined;
};

/**
 * The hero's own title field differs by type — `module_hero` stores it as
 * `heroTitle`, `module_heroBlog` as `heading` — so this reads whichever
 * field the referenced document actually has.
 */
export const resolveHeroHeading = async (
  context: MigrationContext,
  ref: string | undefined,
): Promise<string | undefined> => {
  if (!ref) return undefined;

  const hero = await context.client.fetch<THeroDoc | null>(
    '*[_id == $ref][0]{ _type, heroTitle, heading }',
    { ref },
  );

  if (hero?._type === MODULE_HERO_TYPE)
    return hero.heroTitle?.trim() || undefined;
  if (hero?._type === MODULE_HERO_BLOG_TYPE)
    return hero.heading?.trim() || undefined;

  return undefined;
};

export const resolveOwningPage = async (
  context: MigrationContext,
  postListId: string,
): Promise<TOwningPageDoc | undefined> => {
  const ref = toPublishedId(postListId);

  const owner = await context.client.fetch<TOwningPageDoc | null>(
    `*[_type in [$pageTag, $pageTopic, $pageBlog] && $ref in modules[]._ref][0]{ _type, tag, topic, headingBlock }`,
    {
      ref,
      pageTag: PAGE_TAG_TYPE,
      pageTopic: PAGE_TOPIC_TYPE,
      pageBlog: PAGE_BLOG_TYPE,
    },
  );

  return owner ?? undefined;
};

export const resolvePostListHeading = async (
  context: MigrationContext,
  postListId: string,
): Promise<string | undefined> => {
  const owner = await resolveOwningPage(context, postListId);

  if (!owner) return undefined;

  switch (owner._type) {
    case PAGE_TAG_TYPE:
      return resolveEntityTitle(context, owner.tag?._ref);
    case PAGE_TOPIC_TYPE:
      return resolveEntityTitle(context, owner.topic?._ref);
    case PAGE_BLOG_TYPE:
      return owner.headingBlock?.heading?.trim() || undefined;
    default:
      return undefined;
  }
};

const resolveHeading = (
  doc: THeadingBlockDoc,
  context: MigrationContext,
): Promise<string | undefined> => {
  switch (doc._type) {
    case PAGE_TAG_TYPE:
      return resolveEntityTitle(context, (doc as TPageTagDoc).tag?._ref);
    case PAGE_TOPIC_TYPE:
      return resolveEntityTitle(context, (doc as TPageTopicDoc).topic?._ref);
    case PAGE_HOME_TYPE:
      return resolveHeroHeading(context, (doc as TPageHomeDoc).hero?._ref);
    case MODULE_POST_LIST_TYPE:
      return resolvePostListHeading(context, doc._id);
    default:
      return Promise.resolve(undefined);
  }
};

const DOCUMENT_TYPES = [
  PAGE_TAG_TYPE,
  PAGE_TOPIC_TYPE,
  PAGE_HOME_TYPE,
  MODULE_POST_LIST_TYPE,
];

export default defineMigration({
  title: 'Backfill headingBlock.heading from each document’s derivable source',
  documentTypes: DOCUMENT_TYPES,
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as THeadingBlockDoc;

      if (doc.headingBlock?.heading) return [];

      const heading = await resolveHeading(doc, context);

      if (!heading) {
        // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a document with no clean heading source to the operator running the migration
        console.warn(
          `Skipping ${doc._id}: no derivable headingBlock.heading source found`,
        );
        return [];
      }

      return toHeadingMutations(heading);
    },
  },
});
