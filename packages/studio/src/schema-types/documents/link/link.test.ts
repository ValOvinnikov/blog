import { LINK_TYPE } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { LINK_PAGE_TYPES } from '@blog/studio/schema-types/documents/link/link-page-types';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

type TCustomFn = (
  value: unknown,
  context: { document?: unknown },
) => string | true;

type THiddenFn = (context: { document?: unknown }) => boolean;

const getLinkField = (name: string) => getField(linkSchema, name);

const getOptionValues = (field: ReturnType<typeof getLinkField>) => {
  const options = 'options' in field ? field.options : undefined;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? options.list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

const getOptionsLayout = (field: ReturnType<typeof getLinkField>) => {
  const options = 'options' in field ? field.options : undefined;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getHiddenFn = (field: ReturnType<typeof getLinkField>): THiddenFn => {
  if (!('hidden' in field) || typeof field.hidden !== 'function') {
    throw new Error(`Expected "${field.name}" field to define a hidden() fn.`);
  }

  return field.hidden as THiddenFn;
};

describe('linkSchema linkType field', () => {
  it('is required and offers internal/external as radio options', () => {
    expect(getOptionValues(getLinkField('linkType'))).toEqual([
      LINK_TYPE.INTERNAL,
      LINK_TYPE.EXTERNAL,
    ]);
    expect(getOptionsLayout(getLinkField('linkType'))).toBe('radio');
  });

  it('defaults to internal', () => {
    expect(linkSchema.initialValue).toMatchObject({
      linkType: LINK_TYPE.INTERNAL,
    });
  });
});

describe('linkSchema internalReference field', () => {
  it('targets exactly the eight page document types', () => {
    const field = getLinkField('internalReference');
    const to = 'to' in field ? field.to : undefined;

    expect(to).toEqual(LINK_PAGE_TYPES.map((type) => ({ type })));
  });

  it('is visible when linkType is internal', () => {
    const hidden = getHiddenFn(getLinkField('internalReference'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(false);
  });

  it('is hidden when linkType is external', () => {
    const hidden = getHiddenFn(getLinkField('internalReference'));

    expect(hidden({ document: { linkType: LINK_TYPE.EXTERNAL } })).toBe(true);
  });

  it('requires a value when linkType is internal', () => {
    const validate = getCustomValidator<TCustomFn>(
      getLinkField('internalReference'),
    );

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe('Choose a page for an internal link.');
  });

  it('passes when linkType is internal and a value is set', () => {
    const validate = getCustomValidator<TCustomFn>(
      getLinkField('internalReference'),
    );

    expect(
      validate(
        { _ref: 'page-1' },
        { document: { linkType: LINK_TYPE.INTERNAL } },
      ),
    ).toBe(true);
  });

  it('skips the check when linkType is external', () => {
    const validate = getCustomValidator<TCustomFn>(
      getLinkField('internalReference'),
    );

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(true);
  });
});

describe('linkSchema url field', () => {
  it('is hidden when linkType is internal', () => {
    const hidden = getHiddenFn(getLinkField('url'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });

  it('is visible when linkType is external', () => {
    const hidden = getHiddenFn(getLinkField('url'));

    expect(hidden({ document: { linkType: LINK_TYPE.EXTERNAL } })).toBe(false);
  });

  it('skips the check when linkType is internal', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe(true);
  });

  it('requires a value when linkType is external', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe('Enter a full web address, including https://.');
  });

  it('rejects a relative path', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('/blog', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a bare scheme with no host', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('https://', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('accepts a full http(s) URL', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('https://example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });

  it('rejects a bare domain with no scheme or leading slash', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('example.com', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a javascript: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('javascript:alert(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a data: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('data:text/html,<script>alert(1)</script>', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a vbscript: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('vbscript:msgbox(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a protocol-relative URL', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('//evil.example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects an obfuscated scheme that normalises to javascript:', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('java\tscript:alert(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('accepts an uppercase HTTPS scheme', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('HTTPS://example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });

  it('accepts a URL with a port, path, query and fragment', () => {
    const validate = getCustomValidator<TCustomFn>(getLinkField('url'));

    expect(
      validate('https://example.com:8080/path?query=1#frag', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });
});

describe('linkSchema openInNewTab field', () => {
  it('is hidden when linkType is internal', () => {
    const hidden = getHiddenFn(getLinkField('openInNewTab'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });

  it('is visible when linkType is external', () => {
    const hidden = getHiddenFn(getLinkField('openInNewTab'));

    expect(hidden({ document: { linkType: LINK_TYPE.EXTERNAL } })).toBe(false);
  });
});

describe('linkSchema has no platform field', () => {
  it('does not define a platform field', () => {
    const field = linkSchema.fields.find(
      (field): field is typeof field & { name: string } =>
        'name' in field && field.name === 'platform',
    );

    expect(field).toBeUndefined();
  });
});

describe('linkSchema required fields', () => {
  it('requires title', () => {
    expect(wasRequiredCalled(getLinkField('title'))).toBe(true);
  });

  it('requires label', () => {
    expect(wasRequiredCalled(getLinkField('label'))).toBe(true);
  });

  it('requires linkType', () => {
    expect(wasRequiredCalled(getLinkField('linkType'))).toBe(true);
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

  it('shows "Internal Link" when internal', () => {
    const result = prepare({
      title: 'Homepage CTA',
      linkType: LINK_TYPE.INTERNAL,
    });

    expect(result).toEqual({
      title: 'Homepage CTA',
      subtitle: 'Internal Link',
    });
  });

  it('shows "External Link" when external', () => {
    const result = prepare({
      title: 'Docs Link',
      linkType: LINK_TYPE.EXTERNAL,
    });

    expect(result).toEqual({
      title: 'Docs Link',
      subtitle: 'External Link',
    });
  });

  it('falls back to "Untitled Link" when there is no title', () => {
    const result = prepare({
      title: undefined,
      linkType: LINK_TYPE.INTERNAL,
    });

    expect(result).toEqual({
      title: 'Untitled Link',
      subtitle: 'Internal Link',
    });
  });

  it('falls back to "No link type set" when linkType is missing', () => {
    const result = prepare({
      title: 'Broken Link',
      linkType: undefined,
    });

    expect(result).toEqual({
      title: 'Broken Link',
      subtitle: 'No link type set',
    });
  });
});
