import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { ctaButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { toTitleCase } from '@blog/utils/primitives';

const getField = (name: string) => {
  const field = ctaButtonSchema.fields.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected ctaButtonSchema to define a "${name}" field.`);
  }

  return field;
};

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return list as { title: string; value: string }[];
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

describe('ctaButtonSchema control choices', () => {
  it('keeps variant as a required dropdown', () => {
    const field = getField('variant');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getOptionValues(field)).toEqual(
      Object.values(CTA_ACTION_VARIANT).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    );
  });

  it('keeps appearance as an optional dropdown', () => {
    const field = getField('appearance');

    expect(getLayout(field)).toBe('dropdown');
    expect(field.validation).toBeUndefined();
    expect(getOptionValues(field)).toEqual(
      Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    );
  });

  it('requires a link reference to the link document', () => {
    const field = getField('link');

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
    expect(wasRequiredCalled(field)).toBe(true);
  });
});

describe('ctaButtonSchema preview', () => {
  const prepare = ctaButtonSchema.preview?.prepare;

  it('titles by the link label and subtitles by variant/appearance', () => {
    expect(
      prepare?.({
        label: 'Get Started',
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      }),
    ).toEqual({ title: 'Get Started', subtitle: 'Primary · Contained' });
  });

  it('falls back to a placeholder title when no link label is set', () => {
    expect(
      prepare?.({
        label: undefined,
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
      }),
    ).toMatchObject({ title: 'Button' });
  });
});
