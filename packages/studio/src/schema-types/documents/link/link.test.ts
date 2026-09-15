import { LINK_TYPE } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { LINK_PAGE_TYPES } from '@blog/studio/schema-types/documents/link/link-page-types';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

type TCustomFn = (
  value: unknown,
  context: { document?: unknown },
) => string | true;

type THiddenFn = (context: { document?: unknown }) => boolean;

const getField = (name: string) => {
  const field = linkSchema.fields.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected linkSchema to define a "${name}" field.`);
  }

  return field;
};

const getOptionValues = (field: ReturnType<typeof getField>) => {
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

const getOptionsLayout = (field: ReturnType<typeof getField>) => {
  const options = 'options' in field ? field.options : undefined;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getHiddenFn = (field: ReturnType<typeof getField>): THiddenFn => {
  if (!('hidden' in field) || typeof field.hidden !== 'function') {
    throw new Error(`Expected "${field.name}" field to define a hidden() fn.`);
  }

  return field.hidden as THiddenFn;
};

describe('linkSchema linkType field', () => {
  it('is required and offers internal/external as radio options', () => {
    expect(getOptionValues(getField('linkType'))).toEqual([
      LINK_TYPE.INTERNAL,
      LINK_TYPE.EXTERNAL,
    ]);
    expect(getOptionsLayout(getField('linkType'))).toBe('radio');
  });

  it('defaults to internal', () => {
    expect(linkSchema.initialValue).toMatchObject({
      linkType: LINK_TYPE.INTERNAL,
    });
  });
});

describe('linkSchema internalReference field', () => {
  it('targets exactly the eight page document types', () => {
    const field = getField('internalReference');
    const to = 'to' in field ? field.to : undefined;

    expect(to).toEqual(LINK_PAGE_TYPES.map((type) => ({ type })));
  });

  it('is visible when linkType is internal', () => {
    const hidden = getHiddenFn(getField('internalReference'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(false);
  });

  it('is hidden when linkType is external', () => {
    const hidden = getHiddenFn(getField('internalReference'));

    expect(hidden({ document: { linkType: LINK_TYPE.EXTERNAL } })).toBe(true);
  });

  it('requires a value when linkType is internal', () => {
    const validate = getCustomValidator<TCustomFn>(
      getField('internalReference'),
    );

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe('Choose a page for an internal link.');
  });

  it('passes when linkType is internal and a value is set', () => {
    const validate = getCustomValidator<TCustomFn>(
      getField('internalReference'),
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
      getField('internalReference'),
    );

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(true);
  });
});

describe('linkSchema url field', () => {
  it('is hidden when linkType is internal', () => {
    const hidden = getHiddenFn(getField('url'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });

  it('is visible when linkType is external', () => {
    const hidden = getHiddenFn(getField('url'));

    expect(hidden({ document: { linkType: LINK_TYPE.EXTERNAL } })).toBe(false);
  });

  it('skips the check when linkType is internal', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe(true);
  });

  it('requires a value when linkType is external', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate(undefined, { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe('Enter a full web address, including https://.');
  });

  it('rejects a relative path', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('/blog', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a bare scheme with no host', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('https://', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('accepts a full http(s) URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('https://example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });

  it('rejects a bare domain with no scheme or leading slash', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('example.com', { document: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a javascript: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('javascript:alert(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a data: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('data:text/html,<script>alert(1)</script>', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a vbscript: URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('vbscript:msgbox(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects a protocol-relative URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('//evil.example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('rejects an obfuscated scheme that normalises to javascript:', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('java\tscript:alert(1)', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(
      'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.',
    );
  });

  it('accepts an uppercase HTTPS scheme', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('HTTPS://example.com', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });

  it('accepts a URL with a port, path, query and fragment', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('https://example.com:8080/path?query=1#frag', {
        document: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });
});

describe('linkSchema openInNewTab field', () => {
  it('is hidden when linkType is internal', () => {
    const hidden = getHiddenFn(getField('openInNewTab'));

    expect(hidden({ document: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });

  it('is visible when linkType is external', () => {
    const hidden = getHiddenFn(getField('openInNewTab'));

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
  const wasRequiredCalled = (field: { validation?: unknown }): boolean => {
    if (!field.validation) {
      throw new Error('Expected field to define validation.');
    }

    let requiredCalled = false;
    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      max: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    return requiredCalled;
  };

  it('requires title', () => {
    expect(wasRequiredCalled(getField('title'))).toBe(true);
  });

  it('requires label', () => {
    expect(wasRequiredCalled(getField('label'))).toBe(true);
  });

  it('requires linkType', () => {
    expect(wasRequiredCalled(getField('linkType'))).toBe(true);
  });
});

describe('linkSchema preview', () => {
  it('shows the referenced document title when internal', () => {
    if (!linkSchema.preview?.prepare) {
      throw new Error('Expected linkSchema to define preview.prepare.');
    }

    const result = linkSchema.preview.prepare({
      title: 'Homepage CTA',
      label: 'Get started',
      linkType: LINK_TYPE.INTERNAL,
      internalTitle: 'Landing Page',
      url: undefined,
    });

    expect(result).toEqual({
      title: 'Homepage CTA',
      subtitle: 'Get started — Landing Page',
    });
  });

  it('shows the url when external', () => {
    if (!linkSchema.preview?.prepare) {
      throw new Error('Expected linkSchema to define preview.prepare.');
    }

    const result = linkSchema.preview.prepare({
      title: 'Docs Link',
      label: 'Read the docs',
      linkType: LINK_TYPE.EXTERNAL,
      internalTitle: undefined,
      url: 'https://example.com/docs',
    });

    expect(result).toEqual({
      title: 'Docs Link',
      subtitle: 'Read the docs — https://example.com/docs',
    });
  });
});
