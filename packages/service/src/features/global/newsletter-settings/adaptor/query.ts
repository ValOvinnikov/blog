import { q } from '@blog/service/sanity/query';

// No `.notNull()` on the query: unlike `site-settings`/`navigation`/`footer`,
// `settings_newsletter` isn't seeded at project setup — an editor may not
// have published it yet. That's a legitimate "newsletter not configured"
// state, not a data-integrity error, so the transformer maps a missing
// document to empty settings instead of throwing.
export const newsletterSettingsQuery = q.star
  .filterByType('settings_newsletter')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').nullable(true),
    description: sub.field('description').nullable(true),
  }));
