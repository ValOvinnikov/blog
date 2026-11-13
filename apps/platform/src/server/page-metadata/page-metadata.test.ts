import { makeEnTranslator } from '@platform/testing/en-translator';

import { pageMetadata, rootPageMetadata } from './page-metadata';

const TITLE_KEYS = ['features', 'look', 'voice'];

describe(pageMetadata, () => {
  it.each(TITLE_KEYS)('resolves the title for the %s key', async (titleKey) => {
    const t = makeEnTranslator('pageMetadata');

    await expect(pageMetadata(titleKey)).resolves.toEqual({
      title: t(titleKey),
    });
  });
});

describe(rootPageMetadata, () => {
  it('titles the root and templates every page title beneath it', async () => {
    const t = makeEnTranslator('pageMetadata');

    await expect(rootPageMetadata()).resolves.toEqual({
      title: { default: t('root'), template: t('titleTemplate') },
    });
  });
});
