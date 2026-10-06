import { at, set } from 'sanity/migrate';

import { inDefaultLocale, localizedString } from '../lib/in-default-locale';

import { localizeTaxonomyText } from './index';

describe(localizeTaxonomyText, () => {
  it('moves a title and description into the default language', () => {
    expect(
      localizeTaxonomyText({
        title: 'Design',
        description: 'Notes on design.',
      }),
    ).toEqual([
      at('title', set(localizedString('Design'))),
      at(
        'description',
        set(
          inDefaultLocale(
            'internationalizedArrayTextValue',
            'Notes on design.',
          ),
        ),
      ),
    ]);
  });

  it('localizes only the fields still holding plain text', () => {
    expect(
      localizeTaxonomyText({
        title: localizedString('Design'),
        description: 'Notes on design.',
      }),
    ).toEqual([
      at(
        'description',
        set(
          inDefaultLocale(
            'internationalizedArrayTextValue',
            'Notes on design.',
          ),
        ),
      ),
    ]);
  });

  it('is idempotent — already localized documents are left alone', () => {
    expect(
      localizeTaxonomyText({
        title: localizedString('Design'),
        description: inDefaultLocale(
          'internationalizedArrayTextValue',
          'Notes on design.',
        ),
      }),
    ).toBeUndefined();
  });

  it('leaves documents without text alone', () => {
    expect(localizeTaxonomyText({})).toBeUndefined();
  });
});
