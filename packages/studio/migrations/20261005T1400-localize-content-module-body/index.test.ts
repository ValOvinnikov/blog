import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeContentModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const body = [
  {
    _type: 'block',
    _key: 'block-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span', text: 'Read on.', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'bodyImage',
    _key: 'image-1',
    asset: { _type: 'reference', _ref: 'image-abc123-800x600-jpg' },
    alt: 'A diagram',
    layout: 'FULL_BLEED',
  },
  {
    _type: 'code',
    _key: 'code-1',
    language: 'ts',
    code: 'const x = 1;',
  },
  {
    _type: 'aside',
    _key: 'aside-1',
    kind: 'CONTEXT',
    body: [
      {
        _type: 'block',
        _key: 'aside-block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span', text: 'Aside.', marks: [] }],
        markDefs: [],
      },
    ],
  },
];

const localizedBody = [
  {
    _key: EN,
    _type: 'internationalizedArrayArticleTextValue',
    language: EN,
    value: body,
  },
];

describe(localizeContentModule, () => {
  it('moves the body, embedded blocks included, into the default language', () => {
    expect(localizeContentModule({ body })).toEqual([
      at('body', set(localizedBody)),
    ]);
  });

  it('is idempotent — an already localized body is left alone', () => {
    expect(localizeContentModule({ body: localizedBody })).toBeUndefined();
  });

  it('leaves a module without a body alone', () => {
    expect(localizeContentModule({})).toBeUndefined();
  });
});
