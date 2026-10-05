import { at, set } from 'sanity/migrate';

import { inDefaultLocale, localizedString } from '../lib/in-default-locale';

import { localizeTestimonialDocument } from './index';

const paragraph = (text: string) => [
  { _type: 'block', _key: text, children: [{ _type: 'span', text }] },
];

const localizedQuote = (text: string) =>
  inDefaultLocale('internationalizedArrayListedTextValue', paragraph(text));

const asset = { _type: 'reference', _ref: 'image-1' };

describe(localizeTestimonialDocument, () => {
  it("moves a testimonial's quote, role and photo alt into the default language", () => {
    expect(
      localizeTestimonialDocument({
        _type: 'block_testimonial',
        quote: paragraph('They shipped on time.'),
        role: 'Founder, Acme',
        image: { _type: 'imageWithAlt', asset, alt: 'Jane smiling' },
      }),
    ).toEqual([
      at('quote', set(localizedQuote('They shipped on time.'))),
      at('role', set(localizedString('Founder, Acme'))),
      at(
        'image',
        set({
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('Jane smiling'),
        }),
      ),
    ]);
  });

  it('moves a Testimonials module heading block into the default language', () => {
    expect(
      localizeTestimonialDocument({
        _type: 'module_testimonial',
        headingBlock: { _type: 'headingBlock', heading: 'What people say' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: localizedString('What people say'),
        }),
      ),
    ]);
  });

  it('localizes only the fields still holding plain values', () => {
    expect(
      localizeTestimonialDocument({
        _type: 'block_testimonial',
        quote: localizedQuote('They shipped on time.'),
        role: 'Founder, Acme',
      }),
    ).toEqual([at('role', set(localizedString('Founder, Acme')))]);
  });

  it('is idempotent — already localized documents are left alone', () => {
    expect(
      localizeTestimonialDocument({
        _type: 'block_testimonial',
        quote: localizedQuote('They shipped on time.'),
        role: localizedString('Founder, Acme'),
        image: {
          _type: 'localizedImageWithAlt',
          asset,
          alt: localizedString('Jane smiling'),
        },
      }),
    ).toBeUndefined();
    expect(
      localizeTestimonialDocument({
        _type: 'module_testimonial',
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: localizedString('What people say'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves documents without text alone', () => {
    expect(
      localizeTestimonialDocument({ _type: 'block_testimonial' }),
    ).toBeUndefined();
    expect(
      localizeTestimonialDocument({ _type: 'module_testimonial' }),
    ).toBeUndefined();
  });
});
