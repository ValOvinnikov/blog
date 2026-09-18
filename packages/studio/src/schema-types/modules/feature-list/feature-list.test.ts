import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  FULL_BRAND_VARIANT_LIST,
} from '@blog/config/constants';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { getField } from '@blog/studio/testing/get-field';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { getOptionValues } from '@blog/studio/testing/get-field-option-values';

const getFeatureListField = (name: string) => getField(featureListSchema, name);

type TCall = { method: string; args: unknown[] };

const getFeaturesValidatorCalls = (): TCall[] => {
  const field = getFeatureListField('features');

  if (typeof field.validation !== 'function') {
    throw new Error('Expected features field to define validation.');
  }

  const calls: TCall[] = [];
  const rule = {
    unique: () => {
      calls.push({ method: 'unique', args: [] });
      return rule;
    },
    min: (value: number) => {
      calls.push({ method: 'min', args: [value] });
      return rule;
    },
    max: (value: number) => {
      calls.push({ method: 'max', args: [value] });
      return rule;
    },
    error: (message: string) => {
      calls.push({ method: 'error', args: [message] });
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return calls;
};

describe('featureListSchema brandVariant field', () => {
  it('offers the full brand variant list, defaulting to PRIMARY', () => {
    const field = getFeatureListField('brandVariant');

    expect(getOptionValues(field)).toEqual([...FULL_BRAND_VARIANT_LIST]);
    expect(field.initialValue).toBe(BRAND_VARIANT.PRIMARY);
  });
});

describe('featureListSchema features field', () => {
  it('registers unique, a min(2) and a max(8) rule, each with its own message', () => {
    expect(getFeaturesValidatorCalls()).toEqual([
      { method: 'unique', args: [] },
      { method: 'min', args: [2] },
      {
        method: 'error',
        args: ['A features section needs at least two feature cards.'],
      },
      { method: 'max', args: [8] },
      {
        method: 'error',
        args: ['A features section holds at most eight feature cards.'],
      },
    ]);
  });

  it('only accepts block_feature references', () => {
    const field = getFeatureListField('features') as {
      of?: { to?: { type: string }[] }[];
    };

    expect(field.of?.[0]?.to).toEqual([{ type: 'block_feature' }]);
  });
});

describe('featureListSchema imageShape field', () => {
  it('offers every CARD_IMAGE_SHAPE value as a dropdown, defaulting to WIDE', () => {
    const field = getFeatureListField('imageShape');

    expect(getOptionValues(field)).toEqual(Object.values(CARD_IMAGE_SHAPE));
    expect(getLayout(field)).toBe('dropdown');
    expect(field.initialValue).toBe(CARD_IMAGE_SHAPE.WIDE);
  });

  it('is required', () => {
    const field = getFeatureListField('imageShape');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected imageShape field to define validation.');
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

    expect(requiredCalled).toBe(true);
  });
});

describe('featureListSchema displayMode field', () => {
  it('is emitted immediately after imageShape', () => {
    const names =
      featureListSchema.fields
        ?.map((field) => ('name' in field ? field.name : undefined))
        .filter((name): name is string => Boolean(name)) ?? [];
    const imageShapeIndex = names.indexOf('imageShape');
    const displayModeIndex = names.indexOf('displayMode');

    expect(imageShapeIndex).toBeGreaterThanOrEqual(0);
    expect(displayModeIndex).toBe(imageShapeIndex + 1);
  });

  it('defaults to GRID', () => {
    expect(getFeatureListField('displayMode').initialValue).toBe(
      DISPLAY_MODE.GRID,
    );
  });
});

describe('featureListSchema cardAlignment field', () => {
  it('offers only LEFT and CENTER as a dropdown, defaulting to LEFT', () => {
    const field = getFeatureListField('cardAlignment');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
    ]);
    expect(getLayout(field)).toBe('dropdown');
    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is required', () => {
    const field = getFeatureListField('cardAlignment');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected cardAlignment field to define validation.');
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

    expect(requiredCalled).toBe(true);
  });

  it('is emitted immediately after contentAlignment', () => {
    const names =
      featureListSchema.fields
        ?.map((field) => ('name' in field ? field.name : undefined))
        .filter((name): name is string => Boolean(name)) ?? [];
    const contentAlignmentIndex = names.indexOf('contentAlignment');
    const cardAlignmentIndex = names.indexOf('cardAlignment');

    expect(contentAlignmentIndex).toBeGreaterThanOrEqual(0);
    expect(cardAlignmentIndex).toBe(contentAlignmentIndex + 1);
  });
});

describe('featureListSchema', () => {
  it('has no showImages field', () => {
    const field = featureListSchema.fields?.find(
      (field) => 'name' in field && field.name === 'showImages',
    );

    expect(field).toBeUndefined();
  });

  it('defines no document-level validation', () => {
    expect(featureListSchema.validation).toBeUndefined();
  });
});

describe('featureListSchema preview', () => {
  const prepare = featureListSchema.preview?.prepare;

  it('shows the brand variant and image shape', () => {
    if (!prepare) {
      throw new Error('Expected featureListSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'Why choose us',
        brandVariant: 'PRIMARY',
        imageShape: CARD_IMAGE_SHAPE.WIDE,
      }),
    ).toEqual({
      title: 'Why choose us',
      subtitle: 'Primary · Wide',
    });
  });

  it('falls back to "Unknown" when there is no title', () => {
    if (!prepare) {
      throw new Error('Expected featureListSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: undefined,
        brandVariant: undefined,
        imageShape: undefined,
      }),
    ).toEqual({
      title: 'Unknown',
      subtitle: undefined,
    });
  });
});
