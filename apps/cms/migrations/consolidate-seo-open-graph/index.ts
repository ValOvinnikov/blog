/**
 * Consolidate flat OG fields into the shared `openGraph` object and drop
 * `post.tags`. Run AFTER the schema change (Phase 2, Task 1) + `pnpm typegen`.
 *
 * Transforms:
 *   - `post` / `homePage` / `page` documents: nests the embedded `seo`
 *     object's flat `ogTitle` / `ogDescription` / `ogImage` fields into
 *     `seo.openGraph`.
 *   - `siteSettings`: nests the document-level flat `ogTitle` /
 *     `ogDescription` / `ogImage` fields into `defaultSeo`.
 *   - `post`: removes the now-unused `tags` field.
 *
 * Workflow (see ../README.md for full guardrails):
 *   1. pnpm --filter cms dataset:export -- migrations/backups/production-pre-openGraph.tar.gz
 *   2. pnpm --filter cms migrate:dry -- consolidate-seo-open-graph
 *   3. Inspect the dry-run diff carefully.
 *   4. Only then: pnpm --filter cms migrate:run -- consolidate-seo-open-graph
 *      (human-gated — an agent must not run this step)
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

type TOgSource = {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: unknown;
};

const hasOg = (o: TOgSource): boolean =>
  o.ogTitle !== undefined ||
  o.ogDescription !== undefined ||
  o.ogImage !== undefined;

const toOpenGraph = (o: TOgSource) => ({
  _type: 'openGraph' as const,
  ogTitle: o.ogTitle,
  ogDescription: o.ogDescription,
  ogImage: o.ogImage,
});

const SEO_DOC_TYPES = ['post', 'homePage', 'page'];

export default defineMigration({
  title: 'Consolidate SEO og* into openGraph; drop post.tags',
  documentTypes: ['post', 'homePage', 'page', 'siteSettings'],

  migrate: {
    document(doc) {
      const ops = [];

      // seo.og* -> seo.openGraph on docs that embed an seo object
      if (SEO_DOC_TYPES.includes(doc._type)) {
        const seo = (doc as { seo?: TOgSource }).seo;
        if (seo && hasOg(seo)) {
          ops.push(at('seo.openGraph', set(toOpenGraph(seo))));
          ops.push(at('seo.ogTitle', unset()));
          ops.push(at('seo.ogDescription', unset()));
          ops.push(at('seo.ogImage', unset()));
        }
      }

      // siteSettings flat og* -> defaultSeo
      if (doc._type === 'siteSettings') {
        const s = doc as TOgSource;
        if (hasOg(s)) {
          ops.push(at('defaultSeo', set(toOpenGraph(s))));
          ops.push(at('ogTitle', unset()));
          ops.push(at('ogDescription', unset()));
          ops.push(at('ogImage', unset()));
        }
      }

      // drop post.tags
      if (
        doc._type === 'post' &&
        (doc as { tags?: unknown }).tags !== undefined
      ) {
        ops.push(at('tags', unset()));
      }

      return ops;
    },
  },
});
