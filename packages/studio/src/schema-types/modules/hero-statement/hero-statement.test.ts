import { heroStatementSchema } from './hero-statement';

const getField = (name: string) => {
  const field = heroStatementSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(
      `Expected heroStatementSchema to define a "${name}" field.`,
    );
  }

  return field;
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};

describe('heroStatementSchema field order', () => {
  it('places title, brandVariant, headingBlock, eyebrow, image, ctaButtons before the shared hero tail', () => {
    const names = heroStatementSchema.fields
      ?.map((field) => ('name' in field ? field.name : undefined))
      .slice(0, 6);

    expect(names).toEqual([
      'title',
      'brandVariant',
      'headingBlock',
      'eyebrow',
      'image',
      'ctaButtons',
    ]);
  });
});

describe('heroStatementSchema required fields', () => {
  it('requires brandVariant and headingBlock — brandVariant matches what the service reads as non-null', () => {
    expect(wasRequiredCalled(getField('brandVariant'))).toBe(true);
    expect(wasRequiredCalled(getField('headingBlock'))).toBe(true);
  });
});

describe('heroStatementSchema preview', () => {
  it('selects subtitle from headingBlock.heading', () => {
    expect(heroStatementSchema.preview?.select).toEqual({
      title: 'title',
      subtitle: 'headingBlock.heading',
    });
  });

  it('falls back to Unknown / No heading yet when empty', () => {
    const prepare = heroStatementSchema.preview?.prepare;

    if (!prepare) {
      throw new Error(
        'Expected heroStatementSchema to define preview.prepare.',
      );
    }

    expect(prepare({ title: undefined, subtitle: undefined })).toEqual({
      title: 'Unknown',
      subtitle: 'No heading yet',
    });
  });

  it('shows the title and heading when present', () => {
    const prepare = heroStatementSchema.preview?.prepare;

    if (!prepare) {
      throw new Error(
        'Expected heroStatementSchema to define preview.prepare.',
      );
    }

    expect(
      prepare({ title: 'Home Statement Hero', subtitle: 'We build things.' }),
    ).toEqual({
      title: 'Home Statement Hero',
      subtitle: 'We build things.',
    });
  });
});
