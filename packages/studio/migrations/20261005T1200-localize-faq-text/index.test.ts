import { at, set } from 'sanity/migrate';

import { inDefaultLocale, localizedString } from '../lib/in-default-locale';

import { localizeFaqDocument } from './index';

const paragraph = (text: string) => [
  { _type: 'block', _key: text, children: [{ _type: 'span', text }] },
];

describe(localizeFaqDocument, () => {
  it('moves a question and its answer into the default language', () => {
    expect(
      localizeFaqDocument({
        _type: 'block_faq',
        question: 'How long does it take?',
        answer: paragraph('About six weeks.'),
      }),
    ).toEqual([
      at('question', set(localizedString('How long does it take?'))),
      at(
        'answer',
        set(
          inDefaultLocale(
            'internationalizedArrayListedTextValue',
            paragraph('About six weeks.'),
          ),
        ),
      ),
    ]);
  });

  it('moves an FAQ module heading block into the default language', () => {
    expect(
      localizeFaqDocument({
        _type: 'module_faq',
        headingBlock: { _type: 'headingBlock', heading: 'Questions' },
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: localizedString('Questions'),
        }),
      ),
    ]);
  });

  it('localizes only the fields still holding plain text', () => {
    expect(
      localizeFaqDocument({
        _type: 'block_faq',
        question: localizedString('How long does it take?'),
        answer: paragraph('About six weeks.'),
      }),
    ).toEqual([
      at(
        'answer',
        set(
          inDefaultLocale(
            'internationalizedArrayListedTextValue',
            paragraph('About six weeks.'),
          ),
        ),
      ),
    ]);
  });

  it('is idempotent — already localized documents are left alone', () => {
    expect(
      localizeFaqDocument({
        _type: 'block_faq',
        question: localizedString('How long does it take?'),
        answer: inDefaultLocale(
          'internationalizedArrayListedTextValue',
          paragraph('About six weeks.'),
        ),
      }),
    ).toBeUndefined();
    expect(
      localizeFaqDocument({
        _type: 'module_faq',
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: localizedString('Questions'),
        },
      }),
    ).toBeUndefined();
  });

  it('leaves documents without text alone', () => {
    expect(localizeFaqDocument({ _type: 'block_faq' })).toBeUndefined();
    expect(localizeFaqDocument({ _type: 'module_faq' })).toBeUndefined();
  });
});
