import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeNewsletterModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizeNewsletterModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeNewsletterModule({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'Stay in the loop',
          supportingText: 'New posts weekly.',
        },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: inEnglish(
            'internationalizedArrayStringValue',
            'Stay in the loop',
          ),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'New posts weekly.',
          ),
        }),
      ),
    ]);
  });

  it('is idempotent — an already localized Newsletter is left alone', () => {
    expect(
      localizeNewsletterModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: inEnglish('internationalizedArrayStringValue', 'Subscribe'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a Newsletter without a heading block alone', () => {
    expect(localizeNewsletterModule({})).toBeUndefined();
  });
});
