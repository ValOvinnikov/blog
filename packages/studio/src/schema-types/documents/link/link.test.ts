import { LINK_TYPE } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

type TCustomFn = (
  value: unknown,
  context: { document?: unknown },
) => string | true;

type THiddenFn = (context: { document?: unknown }) => boolean;

const getLinkField = (name: string) => getField(linkSchema, name);

const getHiddenFn = (field: ReturnType<typeof getLinkField>): THiddenFn => {
  if (!('hidden' in field) || typeof field.hidden !== 'function') {
    throw new Error(`Expected "${field.name}" field to define a hidden() fn.`);
  }

  return field.hidden as THiddenFn;
};

describe('linkSchema internalReference field', () => {
  it.each([
    [LINK_TYPE.INTERNAL, false],
    [LINK_TYPE.EXTERNAL, true],
  ])('hidden state for linkType %s is %s', (linkType, expected) => {
    const hidden = getHiddenFn(getLinkField('internalReference'));

    expect(hidden({ document: { linkType } })).toBe(expected);
  });

  it.each([
    [undefined, LINK_TYPE.INTERNAL, 'Choose a page for an internal link.'],
    [{ _ref: 'page-1' }, LINK_TYPE.INTERNAL, true],
    [undefined, LINK_TYPE.EXTERNAL, true],
  ])('validates %j for linkType %s', (value, linkType, expected) => {
    const validate = getCustomValidator<TCustomFn>(
      getLinkField('internalReference'),
    );

    expect(validate(value, { document: { linkType } })).toBe(expected);
  });
});

describe('linkSchema url field', () => {
  it.each([
    [LINK_TYPE.INTERNAL, true],
    [LINK_TYPE.EXTERNAL, false],
  ])('hidden state for linkType %s is %s', (linkType, expected) => {
    const hidden = getHiddenFn(getLinkField('url'));

    expect(hidden({ document: { linkType } })).toBe(expected);
  });

  it('skips the check when linkType is internal', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe(true);
  });

  it.each([
    [undefined, 'Enter a full web address, including https://.'],
    [
      '/blog',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'https://',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'example.com',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'javascript:alert(1)',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'data:text/html,<script>alert(1)</script>',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'vbscript:msgbox(1)',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      '//evil.example.com',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
    [
      'java\tscript:alert(1)',
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    ],
  ])('rejects %j when linkType is external', (value, expected) => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate(value, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(expected);
  });

  it.each([
    'https://example.com',
    'HTTPS://example.com',
    'https://example.com:8080/path?query=1#frag',
  ])('accepts %s when linkType is external', (value) => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate(value, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(true);
  });
});

describe('linkSchema openInNewTab field', () => {
  it.each([
    [LINK_TYPE.INTERNAL, true],
    [LINK_TYPE.EXTERNAL, false],
  ])('hidden state for linkType %s is %s', (linkType, expected) => {
    const hidden = getHiddenFn(getLinkField('openInNewTab'));

    expect(hidden({ document: { linkType } })).toBe(expected);
  });
});

describe('linkSchema preview', () => {
  const prepare = (input: {
    title: string | undefined;
    linkType: string | undefined;
  }) => {
    if (!linkSchema.preview?.prepare) {
      throw new Error('Expected linkSchema to define preview.prepare.');
    }

    return linkSchema.preview.prepare(input);
  };

  it.each([
    [
      'Homepage CTA',
      LINK_TYPE.INTERNAL,
      { title: 'Homepage CTA', subtitle: 'Internal Link' },
    ],
    [
      'Docs Link',
      LINK_TYPE.EXTERNAL,
      { title: 'Docs Link', subtitle: 'External Link' },
    ],
    [
      undefined,
      LINK_TYPE.INTERNAL,
      { title: 'Untitled Link', subtitle: 'Internal Link' },
    ],
    [
      'Broken Link',
      undefined,
      { title: 'Broken Link', subtitle: 'No link type set' },
    ],
  ])('prepares title %j, linkType %j', (title, linkType, expected) => {
    expect(prepare({ title, linkType })).toEqual(expected);
  });
});
