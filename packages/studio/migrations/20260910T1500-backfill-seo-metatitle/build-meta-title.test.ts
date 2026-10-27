import {
  buildEntityPageMetaTitle,
  buildHeadingMetaTitle,
  buildIndexPageMetaTitle,
  META_TITLE_MAX_LENGTH,
  META_TITLE_MIN_LENGTH,
} from './build-meta-title';

const MOCK_BRAND = 'valstack.dev';
const MOCK_TAGLINE = 'Field notes on building software';
const MOCK_SHORT_SUBJECT = 'AI';
const MOCK_SHORT_BRAND = 'X';
const MOCK_SHORT_HEADING = 'SEO That Generates Itself';
const MOCK_LONG_HEADING = 'Shipping Heroes Without a Designer';
const MOCK_LONG_SUBJECT = 'A Subject Long Enough To Need No Padding At All';

describe(buildHeadingMetaTitle, () => {
  it('uses a heading that already clears the floor verbatim', () => {
    const result = buildHeadingMetaTitle(MOCK_LONG_HEADING, MOCK_BRAND);

    expect(result).toBe(MOCK_LONG_HEADING);
  });

  it('uses a heading at the ceiling verbatim', () => {
    const heading = 'x'.repeat(META_TITLE_MAX_LENGTH);

    const result = buildHeadingMetaTitle(heading, MOCK_BRAND);

    expect(result).toBe(heading);
  });

  it('pads a too-short heading with the brand name', () => {
    const result = buildHeadingMetaTitle(MOCK_SHORT_HEADING, MOCK_BRAND);

    expect(result).toBe(`${MOCK_SHORT_HEADING} — ${MOCK_BRAND}`);
  });

  it('trims the heading before measuring it', () => {
    const result = buildHeadingMetaTitle(
      `  ${MOCK_LONG_HEADING}  `,
      MOCK_BRAND,
    );

    expect(result).toBe(MOCK_LONG_HEADING);
  });

  it('truncates a heading longer than the ceiling', () => {
    const heading = 'x'.repeat(META_TITLE_MAX_LENGTH + 10);

    const result = buildHeadingMetaTitle(heading, MOCK_BRAND);

    expect(result).toBe('x'.repeat(META_TITLE_MAX_LENGTH));
  });

  it('falls through to the tagline when heading and brand are still short', () => {
    const result = buildHeadingMetaTitle(
      MOCK_SHORT_SUBJECT,
      MOCK_SHORT_BRAND,
      MOCK_TAGLINE,
    );

    expect(result).toBe(
      `${MOCK_SHORT_SUBJECT} — ${MOCK_SHORT_BRAND} — ${MOCK_TAGLINE}`,
    );
  });

  it.each([
    ['no tagline is available', undefined],
    ['the tagline is empty', ''],
  ])('returns undefined when still short and %s', (_name, tagline) => {
    const result = buildHeadingMetaTitle(
      MOCK_SHORT_SUBJECT,
      MOCK_SHORT_BRAND,
      tagline,
    );

    expect(result).toBeUndefined();
  });
});

describe(buildIndexPageMetaTitle, () => {
  it.each(['Blog', 'Tags', 'Topics'])(
    'pads the bare heading %s with the site tagline',
    (heading) => {
      const result = buildIndexPageMetaTitle(heading, MOCK_TAGLINE);

      expect(result).toBe(`${heading} — ${MOCK_TAGLINE}`);
    },
  );

  it('uses a heading that already clears the floor verbatim', () => {
    const result = buildIndexPageMetaTitle(MOCK_LONG_SUBJECT, MOCK_TAGLINE);

    expect(result).toBe(MOCK_LONG_SUBJECT);
  });

  it.each([
    ['no brand is given', '', undefined],
    ['the brand alone cannot clear the floor', '', MOCK_BRAND],
    ['there is no pad material at all', '', ''],
  ])(
    'returns undefined when the tagline is empty and %s',
    (_name, pad, brand) => {
      const result = buildIndexPageMetaTitle('Blog', pad, brand);

      expect(result).toBeUndefined();
    },
  );
});

describe(buildEntityPageMetaTitle, () => {
  it('pads a short subject up to exactly the floor', () => {
    const subject = 'SEO';

    const result = buildEntityPageMetaTitle(subject, MOCK_BRAND);

    expect(result).toBe(`${subject} — Articles on ${MOCK_BRAND}`);
    expect(result).toHaveLength(META_TITLE_MIN_LENGTH);
  });

  it('pads a longer short subject the same way', () => {
    const subject = 'Building with AI';

    const result = buildEntityPageMetaTitle(subject, MOCK_BRAND);

    expect(result).toBe(`${subject} — Articles on ${MOCK_BRAND}`);
  });

  it('trims a trailing space on the subject', () => {
    const subject = 'AI Agents';

    const result = buildEntityPageMetaTitle(`${subject} `, MOCK_BRAND);

    expect(result).toBe(`${subject} — Articles on ${MOCK_BRAND}`);
  });

  it('uses a subject that already clears the floor verbatim', () => {
    const result = buildEntityPageMetaTitle(MOCK_LONG_SUBJECT, MOCK_BRAND);

    expect(result).toBe(MOCK_LONG_SUBJECT);
  });

  it('falls through to the tagline when subject and brand are still short', () => {
    const result = buildEntityPageMetaTitle(
      MOCK_SHORT_SUBJECT,
      MOCK_SHORT_BRAND,
      MOCK_TAGLINE,
    );

    expect(result).toBe(
      `${MOCK_SHORT_SUBJECT} — Articles on ${MOCK_SHORT_BRAND} — ${MOCK_TAGLINE}`,
    );
  });

  it('returns undefined when still short and no tagline is available', () => {
    const result = buildEntityPageMetaTitle(
      MOCK_SHORT_SUBJECT,
      MOCK_SHORT_BRAND,
    );

    expect(result).toBeUndefined();
  });
});
