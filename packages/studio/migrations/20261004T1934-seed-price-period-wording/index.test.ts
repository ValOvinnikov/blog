import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, setIfMissing } from 'sanity/migrate';

import { seedPricePeriodWording } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (value: string) => [
  { _key: EN, _type: 'internationalizedArrayStringValue', language: EN, value },
];

describe(seedPricePeriodWording, () => {
  it('seeds every price period in English when Site Settings has no wording', () => {
    expect(seedPricePeriodWording({})).toEqual([
      at(
        'pricePeriodSuffix',
        setIfMissing({
          ONE_TIME: inEnglish('one-time'),
          HOUR: inEnglish('per hour'),
          SESSION: inEnglish('per session'),
          MONTH: inEnglish('per month'),
          YEAR: inEnglish('per year'),
        }),
      ),
    ]);
  });

  it('leaves wording an editor already set alone', () => {
    expect(
      seedPricePeriodWording({
        pricePeriodSuffix: { MONTH: inEnglish('/mo') },
      }),
    ).toBeUndefined();
  });
});
