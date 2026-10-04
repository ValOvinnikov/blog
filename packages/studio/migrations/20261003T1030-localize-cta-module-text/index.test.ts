import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeCtaModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

const strings = (value: string) =>
  inEnglish('internationalizedArrayStringValue', value);

const paragraph = [
  {
    _type: 'block',
    _key: 'b1',
    children: [{ _type: 'span', _key: 's1', text: 'Read on.' }],
  },
];

describe(localizeCtaModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeCtaModule({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'Subscribe',
          supportingText: 'New posts weekly.',
        },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: strings('Subscribe'),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'New posts weekly.',
          ),
        }),
      ),
    ]);
  });

  it('moves the eyebrow, content and footnote into the default language', () => {
    expect(
      localizeCtaModule({
        eyebrow: 'Newsletter',
        content: paragraph,
        footnote: 'Unsubscribe any time.',
      }),
    ).toEqual([
      at('eyebrow', set(strings('Newsletter'))),
      at(
        'content',
        set(inEnglish('internationalizedArrayListedTextValue', paragraph)),
      ),
      at('footnote', set(strings('Unsubscribe any time.'))),
    ]);
  });

  it('keeps the image and moves its alt text into the default language', () => {
    const asset = { _type: 'reference', _ref: 'image-1' };

    expect(
      localizeCtaModule({
        image: { _type: 'imageWithAlt', asset, alt: 'A letter' },
      }),
    ).toEqual([
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: strings('A letter'),
        }),
      ),
    ]);
  });

  it('is idempotent — an already localized CTA is left alone', () => {
    expect(
      localizeCtaModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('Subscribe'),
        },
        eyebrow: strings('Newsletter'),
        content: inEnglish('internationalizedArrayListedTextValue', paragraph),
        footnote: strings('Unsubscribe any time.'),
        image: { _type: 'localizedImageWithAlt', alt: strings('A letter') },
      }),
    ).toBeUndefined();
  });

  it('leaves a CTA without text alone', () => {
    expect(localizeCtaModule({})).toBeUndefined();
  });
});
