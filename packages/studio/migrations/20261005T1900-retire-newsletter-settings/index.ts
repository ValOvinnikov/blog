import { defineMigration, del } from 'sanity/migrate';

import { copyNewsletterTrustCues } from '../lib/copy-newsletter-trust-cues';

const SETTINGS_NEWSLETTER_TYPE = 'settings_newsletter';

const PRECONDITION_QUERY = `{
  "settingsTrustCues": *[_type == "${SETTINGS_NEWSLETTER_TYPE}" && !(_id in path("drafts.**"))][0].trustCues,
  "modules": *[_type == "module_newsletter"]{ _id, trustCues }
}`;

type TPrecondition = {
  settingsTrustCues: unknown;
  modules: { _id: string; trustCues?: unknown[] }[];
};

export const findModulesMissingCopiedCues = ({
  settingsTrustCues,
  modules,
}: TPrecondition) =>
  modules
    .filter((module) => copyNewsletterTrustCues(module, settingsTrustCues))
    .map(({ _id }) => _id);

export default defineMigration({
  title:
    'Retire Newsletter settings: delete every settings_newsletter document',
  documentTypes: [SETTINGS_NEWSLETTER_TYPE],
  migrate: {
    async document(doc, context) {
      const missing = findModulesMissingCopiedCues(
        await context.client.fetch<TPrecondition>(PRECONDITION_QUERY),
      );

      if (missing.length > 0) return [];

      return [del(doc._id)];
    },
  },
});
