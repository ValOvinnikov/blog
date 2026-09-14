import { LINK_TYPE } from '@blog/config/constants';
import { linkDestinationFields } from '@blog/studio/schema-types/fields/link-destination-fields/link-destination-fields';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (name: string) => {
  const field = linkDestinationFields().find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(
      `Expected linkDestinationFields() to define a "${name}" field.`,
    );
  }

  return field;
};

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

describe('linkDestinationFields linkType', () => {
  it('is required and offers Internal document / URL or path as a radio', () => {
    const field = getField('linkType') as {
      options?: { layout?: string; list?: { value: string }[] };
    };

    expect(field.options?.layout).toBe('radio');
    expect(field.options?.list?.map((option) => option.value)).toEqual([
      LINK_TYPE.INTERNAL,
      LINK_TYPE.EXTERNAL,
    ]);

    let requiredCalled = false;
    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (getField('linkType').validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

describe('linkDestinationFields internalReference', () => {
  it('is hidden unless Link Type is Internal document', () => {
    const hidden = getHidden(getField('internalReference'));

    expect(hidden({ parent: { linkType: LINK_TYPE.INTERNAL } })).toBe(false);
    expect(hidden({ parent: { linkType: LINK_TYPE.EXTERNAL } })).toBe(true);
    expect(hidden({ parent: {} })).toBe(true);
  });

  it('requires a value only when Link Type is Internal document', () => {
    const validate = getCustomValidator<TCustomFn>(
      getField('internalReference'),
    );

    expect(
      validate(undefined, { parent: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe('Choose a document for an internal link.');
    expect(
      validate(undefined, { parent: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(true);
    expect(
      validate(
        { _ref: 'page_post-abc' },
        { parent: { linkType: LINK_TYPE.INTERNAL } },
      ),
    ).toBe(true);
  });
});

describe('linkDestinationFields url', () => {
  it('is hidden unless Link Type is URL or path', () => {
    const hidden = getHidden(getField('url'));

    expect(hidden({ parent: { linkType: LINK_TYPE.EXTERNAL } })).toBe(false);
    expect(hidden({ parent: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });

  it('passes through when Link Type is not External, regardless of value', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate(undefined, { parent: { linkType: LINK_TYPE.INTERNAL } }),
    ).toBe(true);
  });

  it('requires a value when Link Type is External', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate(undefined, { parent: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe('Enter a URL or path.');
  });

  it('rejects a value that is neither a relative path nor an http(s) URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('not-a-path-or-url', {
        parent: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe('Use a relative path starting with / or a full http(s) URL.');
  });

  it('accepts a relative path or a full http(s) URL', () => {
    const validate = getCustomValidator<TCustomFn>(getField('url'));

    expect(
      validate('/blog', { parent: { linkType: LINK_TYPE.EXTERNAL } }),
    ).toBe(true);
    expect(
      validate('https://example.com', {
        parent: { linkType: LINK_TYPE.EXTERNAL },
      }),
    ).toBe(true);
  });
});

describe('linkDestinationFields openInNewTab', () => {
  it('is hidden unless Link Type is URL or path, and defaults to false', () => {
    const field = getField('openInNewTab');
    const hidden = getHidden(field);

    expect(field.initialValue).toBe(false);
    expect(hidden({ parent: { linkType: LINK_TYPE.EXTERNAL } })).toBe(false);
    expect(hidden({ parent: { linkType: LINK_TYPE.INTERNAL } })).toBe(true);
  });
});
