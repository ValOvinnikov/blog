import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { faker } from '@faker-js/faker';

faker.seed(4112);

const MOCK_TITLE = faker.lorem.words(2);

const { prepare } = languagePreview;

describe(prepare, () => {
  it('subtitles the document with its language', () => {
    const { subtitle } = prepare({
      title: MOCK_TITLE,
      language: LOCALE_ISO_CODES.NL,
    });

    expect(subtitle).toBe(LOCALE_LABEL[LOCALE_ISO_CODES.NL]);
  });

  it('leaves the subtitle empty when the document has no language', () => {
    const { subtitle } = prepare({ title: MOCK_TITLE });

    expect(subtitle).toBeUndefined();
  });
});
