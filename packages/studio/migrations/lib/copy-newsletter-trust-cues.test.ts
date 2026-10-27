import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { copyNewsletterTrustCues } from './copy-newsletter-trust-cues';

faker.seed(10);

const { EN } = LOCALE_ISO_CODES;

const MOCK_FIRST_CUE = faker.lorem.words();
const MOCK_SECOND_CUE = faker.lorem.words();

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
      copyNewsletterTrustCues({}, [MOCK_FIRST_CUE, MOCK_SECOND_CUE]),
    ).toEqual([
      at(
        'trustCues',
        set([
          trustCue('trust-cue-1', MOCK_FIRST_CUE),
          trustCue('trust-cue-2', MOCK_SECOND_CUE),
        ]),
      ),
    ]);
  });

  it('copies into a module whose trust cue list is empty', () => {
    expect(
      copyNewsletterTrustCues({ trustCues: [] }, [MOCK_FIRST_CUE]),
    ).toEqual([
      at('trustCues', set([trustCue('trust-cue-1', MOCK_FIRST_CUE)])),
    ]);
  });

  it('leaves a module that already has trust cues untouched', () => {
    const existingCues = [trustCue(faker.string.uuid(), MOCK_SECOND_CUE)];

    expect(
      copyNewsletterTrustCues({ trustCues: existingCues }, [MOCK_FIRST_CUE]),
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
