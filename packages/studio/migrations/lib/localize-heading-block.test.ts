import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeHeadingBlock } from './localize-heading-block';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizeHeadingBlock, () => {
  it('moves the heading and supporting text into the default language', () => {
    expect(
      localizeHeadingBlock({
        _type: 'headingBlock',
        heading: 'Stay in the loop',
        supportingText: 'New posts weekly.',
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

  it('keeps a heading block without supporting text free of one', () => {
    expect(
      localizeHeadingBlock({ _type: 'headingBlock', heading: 'Subscribe' }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: inEnglish('internationalizedArrayStringValue', 'Subscribe'),
        }),
      ),
    ]);
  });

  it('leaves an already localized heading block alone', () => {
    expect(
      localizeHeadingBlock({
        _type: 'localizedHeadingBlock',
        heading: inEnglish('internationalizedArrayStringValue', 'Subscribe'),
      }),
    ).toEqual([]);
  });

  it('leaves a missing heading block alone', () => {
    expect(localizeHeadingBlock(undefined)).toEqual([]);
  });
});
