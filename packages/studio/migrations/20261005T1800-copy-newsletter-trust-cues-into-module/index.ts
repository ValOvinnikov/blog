import { defineMigration } from 'sanity/migrate';

import {
  copyNewsletterTrustCues,
  type TNewsletterModuleDoc,
} from '../lib/copy-newsletter-trust-cues';

const SETTINGS_TRUST_CUES_QUERY = `*[_type == "settings_newsletter" && !(_id in path("drafts.**"))][0].trustCues`;

export default defineMigration({
  title: 'Copy Newsletter settings trust cues into every Newsletter module',
  documentTypes: ['module_newsletter'],
  migrate: {
    async document(doc, context) {
      const settingsTrustCues = await context.client.fetch<unknown>(
        SETTINGS_TRUST_CUES_QUERY,
      );

      return (
        copyNewsletterTrustCues(
          doc as TNewsletterModuleDoc,
          settingsTrustCues,
        ) ?? []
      );
    },
  },
});
