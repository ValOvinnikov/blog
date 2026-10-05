import { at, defineMigration, set } from 'sanity/migrate';

import { localizedString } from '../lib/in-default-locale';

type TNewsletterModuleDoc = { trustCues?: unknown[] };

const SETTINGS_TRUST_CUES_QUERY = `*[_type == "settings_newsletter" && !(_id in path("drafts.**"))][0].trustCues`;

const toTrustCue = (text: string, index: number) => ({
  _key: `trust-cue-${String(index + 1)}`,
  _type: 'newsletterTrustCue',
  text: localizedString(text),
});

export const copyNewsletterTrustCues = (
  doc: TNewsletterModuleDoc,
  settingsTrustCues: unknown,
) => {
  if (doc.trustCues && doc.trustCues.length > 0) return undefined;

  const cues = Array.isArray(settingsTrustCues)
    ? settingsTrustCues.filter(
        (cue): cue is string => typeof cue === 'string' && cue.trim() !== '',
      )
    : [];

  return cues.length > 0
    ? [at('trustCues', set(cues.map(toTrustCue)))]
    : undefined;
};

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
