/**
 * Inline `homePage.secondaryAction` — convert the legacy reference to a `link`
 * document into an inline `link` object. Run AFTER the `unify-links` migration.
 * One-off, co-located with the migration it belongs to.
 *
 * This does what the migration cannot: dereference the referenced document. It
 * uses the Sanity CLI's real client (`getCliClient`), not the migration
 * runner's Proxy client (which throws with the installed @sanity/client). It
 * MUTATES the dataset — human-gated. Targets the `SANITY_STUDIO_DATASET` dataset
 * (default `production`) via `sanity.cli.ts`. Run with the sanity CLI:
 *
 *   pnpm --filter cms exec sanity exec migrations/unify-links/inline-hero.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

// Keep in sync with @blog/config `TLINK_TYPE` (avoid a cross-package import in
// the exec bundle).
const LINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' };

async function run() {
  const client = getCliClient();

  const home = await client.getDocument('homePage');
  if (!home) {
    console.log('No homePage document — nothing to do.');
    return;
  }

  const action = home.secondaryAction;
  if (!action || action._type !== 'reference' || !action._ref) {
    console.log(
      'homePage.secondaryAction is not a reference (already inline or empty) — nothing to do.',
    );
    return;
  }

  const link = await client.getDocument(action._ref);
  if (!link) {
    await client.patch(home._id).unset(['secondaryAction']).commit();
    console.log(
      `Dangling reference ${action._ref} — unset homePage.secondaryAction.`,
    );
    return;
  }

  const inline = {
    _type: 'link',
    label: link.label,
    linkType: link.linkType === 'internal' ? LINK_TYPE.INTERNAL : LINK_TYPE.EXTERNAL,
  };
  if (link.internalReference !== undefined) {
    inline.internalReference = link.internalReference;
  }
  if (link.url !== undefined) {
    inline.url = link.url;
  }

  await client.patch(home._id).set({ secondaryAction: inline }).commit();
  console.log(`Inlined homePage.secondaryAction from link ${action._ref}.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
