import {
  EMAIL_PORTABLE_TEXT_SCHEMA,
  isBlankPortableTextValue,
} from './portable-text-schema';

describe('EMAIL_PORTABLE_TEXT_SCHEMA', () => {
  it('offers no block object or inline object types', () => {
    // The action element (sign-in button, invite accept, unsubscribe link)
    // must never be authorable from inside the body — no schema entry means
    // the editor has no way to insert or represent one.
    expect(EMAIL_PORTABLE_TEXT_SCHEMA).not.toHaveProperty('blockObjects');
    expect(EMAIL_PORTABLE_TEXT_SCHEMA).not.toHaveProperty('inlineObjects');
  });

  it('matches exactly the block vocabulary the email serializer renders', () => {
    expect(EMAIL_PORTABLE_TEXT_SCHEMA.decorators?.map((d) => d.name)).toEqual([
      'strong',
      'em',
    ]);
    expect(EMAIL_PORTABLE_TEXT_SCHEMA.styles?.map((s) => s.name)).toEqual([
      'normal',
      'h2',
    ]);
    expect(EMAIL_PORTABLE_TEXT_SCHEMA.lists?.map((l) => l.name)).toEqual([
      'bullet',
      'number',
    ]);
    expect(EMAIL_PORTABLE_TEXT_SCHEMA.annotations?.map((a) => a.name)).toEqual([
      'link',
    ]);
  });
});

describe(isBlankPortableTextValue, () => {
  it('treats undefined and null as blank', () => {
    expect(isBlankPortableTextValue(undefined)).toBe(true);
    expect(isBlankPortableTextValue(null)).toBe(true);
  });

  it('treats an empty array as blank', () => {
    expect(isBlankPortableTextValue([])).toBe(true);
  });

  it('treats a single empty normal-style paragraph as blank', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          style: 'normal',
          children: [{ _type: 'span', _key: 's1', text: '', marks: [] }],
        },
      ]),
    ).toBe(true);
  });

  it('treats whitespace-only text as blank', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          children: [{ _type: 'span', _key: 's1', text: '   ', marks: [] }],
        },
      ]),
    ).toBe(true);
  });

  it('is not blank when real text is present', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          style: 'normal',
          children: [{ _type: 'span', _key: 's1', text: 'Hello', marks: [] }],
        },
      ]),
    ).toBe(false);
  });

  it('is not blank for a heading style, even with empty text', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          style: 'h2',
          children: [{ _type: 'span', _key: 's1', text: '', marks: [] }],
        },
      ]),
    ).toBe(false);
  });

  it('is not blank for a list item, even with empty text', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          listItem: 'bullet',
          children: [{ _type: 'span', _key: 's1', text: '', marks: [] }],
        },
      ]),
    ).toBe(false);
  });

  it('is not blank when more than one block is present', () => {
    expect(
      isBlankPortableTextValue([
        {
          _type: 'block',
          _key: 'k1',
          children: [{ _type: 'span', _key: 's1', text: '', marks: [] }],
        },
        {
          _type: 'block',
          _key: 'k2',
          children: [{ _type: 'span', _key: 's2', text: '', marks: [] }],
        },
      ]),
    ).toBe(false);
  });
});
