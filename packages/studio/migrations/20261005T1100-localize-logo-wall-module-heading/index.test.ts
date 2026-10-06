import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeLogoWallModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizeLogoWallModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeLogoWallModule({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'Trusted by',
          supportingText: 'Teams of every size.',
        },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: inEnglish('internationalizedArrayStringValue', 'Trusted by'),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'Teams of every size.',
          ),
        }),
      ),
    ]);
  });

  it('is idempotent — an already localized Logo Wall is left alone', () => {
    expect(
      localizeLogoWallModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: inEnglish('internationalizedArrayStringValue', 'Trusted by'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a Logo Wall without a heading block alone', () => {
    expect(localizeLogoWallModule({})).toBeUndefined();
  });
});
