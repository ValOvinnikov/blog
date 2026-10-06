import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { copyNewsletterTrustCues } from './copy-newsletter-trust-cues';

const { EN } = LOCALE_ISO_CODES;

const trustCue = (key: string, text: string) => ({
  _key: key,
  _type: 'newsletterTrustCue',
  text: [
    {
      _key: EN,
      _type: 'internationalizedArrayStringValue',
      language: EN,
      value: text,
    },
  ],
});

describe(copyNewsletterTrustCues, () => {
  it('copies the settings trust cues into the module in the default language', () => {
    expect(
      copyNewsletterTrustCues({}, ['No spam', 'Unsubscribe anytime']),
    ).toEqual([
      at(
        'trustCues',
        set([
          trustCue('trust-cue-1', 'No spam'),
          trustCue('trust-cue-2', 'Unsubscribe anytime'),
        ]),
      ),
    ]);
  });

  it('copies into a module whose trust cue list is empty', () => {
    expect(copyNewsletterTrustCues({ trustCues: [] }, ['No spam'])).toEqual([
      at('trustCues', set([trustCue('trust-cue-1', 'No spam')])),
    ]);
  });

  it('leaves a module that already has trust cues untouched', () => {
    expect(
      copyNewsletterTrustCues(
        { trustCues: [trustCue('existing', 'Weekly digest')] },
        ['No spam'],
      ),
    ).toBeUndefined();
  });

  it.each([
    ['no settings document', null],
    ['settings without trust cues', undefined],
    ['an empty trust cue list', []],
    ['only blank trust cues', ['', '  ']],
  ])('leaves the module untouched for %s', (_label, settingsTrustCues) => {
    expect(copyNewsletterTrustCues({}, settingsTrustCues)).toBeUndefined();
  });
});
