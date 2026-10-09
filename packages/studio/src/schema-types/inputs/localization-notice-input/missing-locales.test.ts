import { LOCALE_ISO_CODES } from '@blog/config/constants';

import {
  collectMissingLocales,
  getMissingLocales,
  getMissingTranslations,
} from './missing-locales';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const item = (language: string, value: unknown) => ({
  _key: language,
  _type: 'internationalizedArrayStringValue',
  language,
  value,
});

describe(getMissingLocales, () => {
  it('lists every live language without a value', () => {
    expect(getMissingLocales([item(EN, 'Hello')], [EN, NL, FR])).toEqual([
      NL,
      FR,
    ]);
  });

  it('treats a blank value as missing', () => {
    expect(
      getMissingLocales([item(EN, 'Hello'), item(NL, '  ')], [EN, NL]),
    ).toEqual([NL]);
  });

  it('treats empty formatted text as missing', () => {
    const block = { _type: 'block', children: [] };

    expect(
      getMissingLocales([item(EN, [block]), item(NL, [])], [EN, NL]),
    ).toEqual([NL]);
  });

  it('reports every live language for an empty field', () => {
    expect(getMissingLocales(undefined, [EN, NL])).toEqual([EN, NL]);
  });

  it('ignores languages that are not live', () => {
    expect(
      getMissingLocales([item(EN, 'Hello'), item(FR, 'Bonjour')], [EN]),
    ).toEqual([]);
  });
});

describe(getMissingTranslations, () => {
  it('lists the languages a partly translated field is missing', () => {
    expect(getMissingTranslations([item(EN, 'Hello')], [EN, NL, FR])).toEqual([
      NL,
      FR,
    ]);
  });

  it('reports nothing for a field left empty in every language', () => {
    expect(getMissingTranslations(undefined, [EN, NL])).toEqual([]);
  });

  it('reports nothing for a field whose every language is blank', () => {
    expect(
      getMissingTranslations([item(EN, ''), item(NL, '  ')], [EN, NL]),
    ).toEqual([]);
  });

  it('lists the default language when only a translation is filled', () => {
    expect(getMissingTranslations([item(NL, 'Hallo')], [EN, NL])).toEqual([EN]);
  });
});

describe(collectMissingLocales, () => {
  it('collects missing languages across nested localized fields, in live order', () => {
    const document = {
      _type: 'module_cta',
      heading: [item(EN, 'Hi'), item(NL, 'Hoi')],
      buttons: [
        { _type: 'button', label: [item(EN, 'Go'), item(FR, 'Aller')] },
      ],
    };

    expect(collectMissingLocales(document, [EN, NL, FR], EN)).toEqual([NL, FR]);
  });

  it('reports nothing for a document without localized fields', () => {
    expect(
      collectMissingLocales({ _type: 'page', title: 'About' }, [EN, NL], EN),
    ).toEqual([]);
  });

  it('ignores a localized field left empty in every language', () => {
    const document = {
      _type: 'module_heroStatement',
      heading: [item(EN, 'Hi'), item(NL, 'Hoi')],
      supportingText: [item(EN, ''), item(NL, '')],
    };

    expect(collectMissingLocales(document, [EN, NL], EN)).toEqual([]);
  });

  it('never lists the default language', () => {
    const document = {
      _type: 'module_cta',
      heading: [item(EN, 'Hi')],
      label: [item(NL, 'Hoi')],
    };

    expect(collectMissingLocales(document, [EN, NL], EN)).toEqual([NL]);
  });
});
