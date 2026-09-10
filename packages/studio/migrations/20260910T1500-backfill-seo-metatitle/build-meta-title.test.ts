import {
  buildEntityPageMetaTitle,
  buildHeadingMetaTitle,
  buildIndexPageMetaTitle,
  META_TITLE_MAX_LENGTH,
  META_TITLE_MIN_LENGTH,
} from './build-meta-title';

const BRAND = 'valstack.dev';
const TAGLINE = 'Field notes on building software';

describe(buildHeadingMetaTitle, () => {
  it('uses the heading verbatim once it already clears the floor', () => {
    expect(
      buildHeadingMetaTitle('Shipping Heroes Without a Designer', BRAND),
    ).toBe('Shipping Heroes Without a Designer');
  });

  it('uses a 60-character heading verbatim at the ceiling', () => {
    const heading =
      '24 Days, ~1,250 Commits: What the Agents Got Right and Wrong';

    expect(heading).toHaveLength(60);
    expect(buildHeadingMetaTitle(heading, BRAND)).toBe(heading);
  });

  it('pads a too-short heading with the brand name', () => {
    expect(buildHeadingMetaTitle('SEO That Generates Itself', BRAND)).toBe(
      'SEO That Generates Itself — valstack.dev',
    );
  });

  it('trims the heading before measuring it', () => {
    expect(
      buildHeadingMetaTitle('  Shipping Heroes Without a Designer  ', BRAND),
    ).toBe('Shipping Heroes Without a Designer');
  });

  it('truncates a heading longer than the ceiling', () => {
    const heading = 'x'.repeat(70);

    const result = buildHeadingMetaTitle(heading, BRAND);

    expect(result).toBeDefined();
    expect(result?.length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
    expect(result).toBe('x'.repeat(60));
  });

  it('falls through to the tagline when heading + brand alone is still short', () => {
    const result = buildHeadingMetaTitle('AI', 'X', TAGLINE);

    expect(result).toBeDefined();
    expect(result?.length).toBeGreaterThanOrEqual(META_TITLE_MIN_LENGTH);
    expect(result?.length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
    expect(result).toContain('AI');
    expect(result).toContain(TAGLINE);
  });

  it('returns undefined when heading + brand is short and no tagline is available', () => {
    expect(buildHeadingMetaTitle('AI', 'X')).toBeUndefined();
  });

  it('returns undefined when every pad is exhausted and still short', () => {
    expect(buildHeadingMetaTitle('AI', 'X', '')).toBeUndefined();
  });
});

describe(buildIndexPageMetaTitle, () => {
  it('pads a bare singleton heading with the site tagline', () => {
    expect(buildIndexPageMetaTitle('Blog', TAGLINE)).toBe(
      'Blog — Field notes on building software',
    );
    expect(buildIndexPageMetaTitle('Tags', TAGLINE)).toBe(
      'Tags — Field notes on building software',
    );
    expect(buildIndexPageMetaTitle('Topics', TAGLINE)).toBe(
      'Topics — Field notes on building software',
    );
  });

  it('uses the heading verbatim once it already clears the floor', () => {
    const heading = 'A Heading That Is Already Long Enough On Its Own';

    expect(buildIndexPageMetaTitle(heading, TAGLINE)).toBe(heading);
  });

  it('returns undefined when the tagline pad alone is still short and no brand is given', () => {
    expect(buildIndexPageMetaTitle('Blog', '')).toBeUndefined();
  });

  it('returns undefined when neither the pad text nor the brand clears the floor', () => {
    expect(buildIndexPageMetaTitle('Blog', '', BRAND)).toBeUndefined();
  });

  it('returns undefined when there is no usable pad material at all', () => {
    expect(buildIndexPageMetaTitle('Blog', '', '')).toBeUndefined();
  });
});

describe(buildEntityPageMetaTitle, () => {
  it('pads a short tag name to clear the floor, at exactly 30 for the shortest tag', () => {
    const result = buildEntityPageMetaTitle('SEO', BRAND);

    expect(result).toBe('SEO — Articles on valstack.dev');
    expect(result).toHaveLength(META_TITLE_MIN_LENGTH);
  });

  it('pads every known page_tag subject within 30–60', () => {
    const tags = [
      'Illustration',
      'CI/CD',
      'Tailwind',
      'Claude Code',
      'Architecture',
      'AI Agents',
      'Static Rendering',
      'Sanity',
      'SEO',
      'Monorepo',
      'groqd',
      'Typegen',
      'Next.js',
      'TypeScript',
      'Portable Text',
    ];

    for (const tag of tags) {
      const result = buildEntityPageMetaTitle(tag, BRAND);

      expect(result).toBeDefined();
      expect(result?.length).toBeGreaterThanOrEqual(META_TITLE_MIN_LENGTH);
      expect(result?.length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
    }
  });

  it('trims a trailing space on the source tag title', () => {
    expect(buildEntityPageMetaTitle('AI Agents ', BRAND)).toBe(
      'AI Agents — Articles on valstack.dev',
    );
  });

  it('pads a topic title the same way', () => {
    expect(buildEntityPageMetaTitle('Building with AI', BRAND)).toBe(
      'Building with AI — Articles on valstack.dev',
    );
  });

  it('uses the subject verbatim once it already clears the floor', () => {
    const subject = 'A Subject Long Enough To Need No Padding At All';

    expect(buildEntityPageMetaTitle(subject, BRAND)).toBe(subject);
  });

  it('falls through to the tagline when subject + brand pad is still short', () => {
    const result = buildEntityPageMetaTitle('AI', 'X', TAGLINE);

    expect(result).toBeDefined();
    expect(result?.length).toBeGreaterThanOrEqual(META_TITLE_MIN_LENGTH);
    expect(result?.length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
    expect(result).toContain(TAGLINE);
  });

  it('returns undefined when subject + brand pad is short and no tagline is available', () => {
    expect(buildEntityPageMetaTitle('AI', 'X')).toBeUndefined();
  });
});
