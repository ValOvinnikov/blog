import { at, set } from 'sanity/migrate';

import { localizedString } from './in-default-locale';

export type TNewsletterModuleDoc = { trustCues?: unknown[] };

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
