import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import {
  getCustomValidator,
  getRecordedValidators,
} from '@blog/studio/testing/create-mock-validation-rule';

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

describe('linkSchema exactly-one-target validation', () => {
  const getInternalReferenceValidator = (): TCustomFn =>
    getCustomValidator<TCustomFn>(getField('internalReference'));

  const getUrlExactlyOneValidator = (): TCustomFn =>
    getRecordedValidators<TCustomFn>(getField('url'))[0]!.fn;

  it('rejects when neither internalReference nor url is set', () => {
    const validate = getInternalReferenceValidator();

    expect(validate(undefined, { document: {} })).toBe(
      'Choose an internal page or enter a URL.',
    );
  });

  it('rejects when both internalReference and url are set', () => {
    const validate = getInternalReferenceValidator();

    expect(
      validate(undefined, {
        document: {
          internalReference: { _ref: 'page-1' },
          url: '/blog',
        },
      }),
    ).toBe('Choose either an internal page or a URL — not both.');
  });

  it('passes with only internalReference set', () => {
    const validate = getInternalReferenceValidator();

    expect(
      validate(undefined, {
        document: { internalReference: { _ref: 'page-1' } },
      }),
    ).toBe(true);
  });

  it('passes with only url set', () => {
    const validate = getUrlExactlyOneValidator();

    expect(validate(undefined, { document: { url: '/blog' } })).toBe(true);
  });

  it('the url field registers the same exactly-one-target check as internalReference', () => {
    const validate = getUrlExactlyOneValidator();

    expect(validate(undefined, { document: {} })).toBe(
      'Choose an internal page or enter a URL.',
    );
  });
});

describe('linkSchema url format validation', () => {
  const getUrlFormatValidator = (): TCustomFn =>
    getRecordedValidators<TCustomFn>(getField('url'))[1]!.fn;

  it('accepts an empty value (format check only applies once a value exists)', () => {
    const validate = getUrlFormatValidator();

    expect(validate(undefined, { document: {} })).toBe(true);
  });

  it('accepts a relative path', () => {
    const validate = getUrlFormatValidator();

    expect(validate('/blog', { document: { url: '/blog' } })).toBe(true);
  });

  it('accepts a full http(s) URL', () => {
    const validate = getUrlFormatValidator();

    expect(
      validate('https://example.com', {
        document: { url: 'https://example.com' },
      }),
    ).toBe(true);
  });

  it('rejects a bare domain with no scheme or leading slash', () => {
    const validate = getUrlFormatValidator();

    expect(validate('example.com', { document: { url: 'example.com' } })).toBe(
      'Use a relative path starting with / or a full http(s) URL.',
    );
  });
});

describe('linkSchema openInNewTab field', () => {
  it('is hidden when no url is set', () => {
    const field = getField('openInNewTab');

    if (!('hidden' in field) || typeof field.hidden !== 'function') {
      throw new Error('Expected openInNewTab field to define a hidden() fn.');
    }

    const hidden = field.hidden as THiddenFn;

    expect(hidden({ document: {} })).toBe(true);
    expect(hidden({ document: { internalReference: { _ref: 'p1' } } })).toBe(
      true,
    );
  });

  it('is visible once a url is set', () => {
    const field = getField('openInNewTab');
    const hidden = field.hidden as THiddenFn;

    expect(hidden({ document: { url: '/blog' } })).toBe(false);
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
});

describe('linkSchema preview', () => {
  it('shows the referenced document title when internal', () => {
    if (!linkSchema.preview?.prepare) {
      throw new Error('Expected linkSchema to define preview.prepare.');
    }

    const result = linkSchema.preview.prepare({
      title: 'Homepage CTA',
      label: 'Get started',
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
      internalTitle: undefined,
      url: 'https://example.com/docs',
    });

    expect(result).toEqual({
      title: 'Docs Link',
      subtitle: 'Read the docs — https://example.com/docs',
    });
  });
});
