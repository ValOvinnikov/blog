import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizePostLatestHeading } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizePostLatestHeading, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizePostLatestHeading({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'Latest posts',
          supportingText: 'Fresh from the blog.',
        },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: inEnglish(
            'internationalizedArrayStringValue',
            'Latest posts',
          ),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'Fresh from the blog.',
          ),
        }),
      ),
    ]);
  });

  it('is idempotent — an already localized heading block is left alone', () => {
    expect(
      localizePostLatestHeading({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: inEnglish(
            'internationalizedArrayStringValue',
            'Latest posts',
          ),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves a module without a heading block alone', () => {
    expect(localizePostLatestHeading({})).toBeUndefined();
  });
});
