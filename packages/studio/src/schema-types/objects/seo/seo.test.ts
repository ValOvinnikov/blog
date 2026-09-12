import {
  SEO_META_TITLE_MAX_LENGTH,
  SEO_META_TITLE_MIN_LENGTH,
  seoSchema,
} from '@blog/studio/schema-types/objects/seo/seo';

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  readonly path: string;
  required: () => TMockRule;
  min: (n: number) => TMockRule;
  max: (n: number) => TMockRule;
};

const createMockRule = (callLog: TCallLog, path = 'rule'): TMockRule => ({
  path,
  required: () => {
    callLog.push({ method: 'required', args: [] });
    return createMockRule(callLog, `${path}.required()`);
  },
  min: (n) => {
    callLog.push({ method: 'min', args: [n] });
    return createMockRule(callLog, `${path}.min(${n})`);
  },
  max: (n) => {
    callLog.push({ method: 'max', args: [n] });
    return createMockRule(callLog, `${path}.max(${n})`);
  },
});

const getField = (name: string) =>
  seoSchema.fields?.find((field) => field.name === name);

const runFieldValidation = (
  field: ReturnType<typeof getField>,
  callLog: TCallLog,
): TMockRule => {
  if (!field || !('validation' in field) || !field.validation) {
    throw new Error(
      `Expected seoSchema field "${String(field)}" to define validation.`,
    );
  }

  const baseRule = createMockRule(callLog);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (field.validation as any)(baseRule) as TMockRule;
};

describe('seoSchema metaTitle validation', () => {
  it('is required, with min(30) then max(60)', () => {
    const callLog: TCallLog = [];

    runFieldValidation(getField('metaTitle'), callLog);

    expect(callLog).toEqual([
      { method: 'required', args: [] },
      { method: 'min', args: [SEO_META_TITLE_MIN_LENGTH] },
      { method: 'max', args: [SEO_META_TITLE_MAX_LENGTH] },
    ]);
  });

  it('exports 30 as the minimum and 60 as the maximum', () => {
    expect(SEO_META_TITLE_MIN_LENGTH).toBe(30);
    expect(SEO_META_TITLE_MAX_LENGTH).toBe(60);
  });

  it('does not claim an empty value falls back to page content', () => {
    expect(getField('metaTitle')?.description).not.toMatch(/page content/i);
    expect(getField('metaDescription')?.description).not.toMatch(
      /page content/i,
    );
    expect(getField('openGraph')?.description).not.toMatch(/page content/i);
  });
});

describe('seoSchema metaDescription validation', () => {
  it('keeps max(160) only, unchanged', () => {
    const callLog: TCallLog = [];

    runFieldValidation(getField('metaDescription'), callLog);

    expect(callLog).toEqual([{ method: 'max', args: [160] }]);
  });
});

describe('seoSchema openGraph field', () => {
  it('stays optional — no validation declared', () => {
    expect(getField('openGraph')?.validation).toBeUndefined();
  });
});
