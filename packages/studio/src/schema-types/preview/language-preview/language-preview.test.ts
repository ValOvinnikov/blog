import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';

import { languagePreview } from './language-preview';

const { prepare } = languagePreview;

describe('languagePreview', () => {
  it('subtitles the document with its language', () => {
    expect(
      prepare({ title: 'Blog', language: LOCALE_ISO_CODES.NL }).subtitle,
    ).toBe(LOCALE_LABEL[LOCALE_ISO_CODES.NL]);
  });

  it('leaves the subtitle empty when the document has no language', () => {
    expect(prepare({ title: 'Blog' }).subtitle).toBeUndefined();
  });

  it('falls back to Unknown when the document has no title', () => {
    expect(prepare({}).title).toBe('Unknown');
  });
});
