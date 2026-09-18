import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  FULL_BRAND_VARIANT_LIST,
} from '@blog/config/constants';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import {
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import type { SanityDocument, ValidationContext } from 'sanity';

type TDocFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true> | string | true;

const getField = (name: string) => {
  const field = featureListSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected featureListSchema to define a "${name}" field.`);
  }

  return field;
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

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

const getOptionsLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

type TCall = { method: string; args: unknown[] };

const getFeaturesValidatorCalls = (): TCall[] => {
  const field = getField('features');

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

const getDocumentValidators = (): TRecordedValidator<TDocFn>[] =>
  getRecordedValidators<TDocFn>(featureListSchema);

const createMockContext = (
  fetchImpl: (query: string, params?: unknown) => unknown,
): ValidationContext => {
  const getClient = () => ({
    withConfig: () => ({
      fetch: async (query: string, params?: unknown) =>
        fetchImpl(query, params),
    }),
  });

  return { getClient } as unknown as ValidationContext;
};

describe('featureListSchema brandVariant field', () => {
  it('offers the full brand variant list', () => {
    expect(getOptionValues(getField('brandVariant'))).toEqual([
      ...FULL_BRAND_VARIANT_LIST,
    ]);
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
    const field = getField('features') as {
      of?: { to?: { type: string }[] }[];
    };

    expect(field.of?.[0]?.to).toEqual([{ type: 'block_feature' }]);
  });
});

describe('featureListSchema imageShape field', () => {
  it('offers every CARD_IMAGE_SHAPE value as a dropdown, defaulting to ICON', () => {
    const field = getField('imageShape');

    expect(getOptionValues(field)).toEqual(Object.values(CARD_IMAGE_SHAPE));
    expect(getOptionsLayout(field)).toBe('dropdown');
    expect(field.initialValue).toBe(CARD_IMAGE_SHAPE.ICON);
  });

  it('is required', () => {
    const field = getField('imageShape');

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
  it('is emitted immediately after imageShape, which follows showImages', () => {
    const names =
      featureListSchema.fields
        ?.map((field) => ('name' in field ? field.name : undefined))
        .filter((name): name is string => Boolean(name)) ?? [];
    const showImagesIndex = names.indexOf('showImages');
    const imageShapeIndex = names.indexOf('imageShape');
    const displayModeIndex = names.indexOf('displayMode');

    expect(showImagesIndex).toBeGreaterThanOrEqual(0);
    expect(imageShapeIndex).toBe(showImagesIndex + 1);
    expect(displayModeIndex).toBe(imageShapeIndex + 1);
  });

  it('defaults to GRID', () => {
    expect(getField('displayMode').initialValue).toBe(DISPLAY_MODE.GRID);
  });
});

describe('featureListSchema cardAlignment field', () => {
  it('offers only LEFT and CENTER as a dropdown, defaulting to LEFT', () => {
    const field = getField('cardAlignment');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
    ]);
    expect(getOptionsLayout(field)).toBe('dropdown');
    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is required', () => {
    const field = getField('cardAlignment');

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

describe('featureListSchema document validation', () => {
  it('registers exactly one warning-level rule', () => {
    const validators = getDocumentValidators();

    expect(validators).toHaveLength(1);
    expect(validators[0]!.level).toBe('warning');
  });

  it('passes without querying when Show Images is off', async () => {
    const [validate] = getDocumentValidators();
    let called = false;
    const context = createMockContext(() => {
      called = true;
      return [];
    });

    await expect(
      validate!.fn(
        {
          showImages: false,
          imageShape: CARD_IMAGE_SHAPE.ICON,
          features: [{ _ref: 'card-1' }],
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(true);
    expect(called).toBe(false);
  });

  it('passes without querying when no features are chosen', async () => {
    const [validate] = getDocumentValidators();
    let called = false;
    const context = createMockContext(() => {
      called = true;
      return [];
    });

    await expect(
      validate!.fn(
        {
          showImages: true,
          imageShape: CARD_IMAGE_SHAPE.ICON,
          features: [],
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(true);
    expect(called).toBe(false);
  });

  it('warns when the Icon shape is chosen and a card has no icon', async () => {
    const [validate] = getDocumentValidators();
    const context = createMockContext(() => [
      { icon: 'CODE' },
      { icon: undefined },
    ]);

    await expect(
      validate!.fn(
        {
          showImages: true,
          imageShape: CARD_IMAGE_SHAPE.ICON,
          features: [{ _ref: 'card-1' }, { _ref: 'card-2' }],
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(
      'Some feature cards have no icon, so the grid will look uneven.',
    );
  });

  it('warns when an image shape is chosen and a card has no image', async () => {
    const [validate] = getDocumentValidators();
    const context = createMockContext(() => [
      { image: { asset: {} } },
      { image: undefined },
    ]);

    await expect(
      validate!.fn(
        {
          showImages: true,
          imageShape: CARD_IMAGE_SHAPE.WIDE,
          features: [{ _ref: 'card-1' }, { _ref: 'card-2' }],
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(
      'Some feature cards have no image, so the grid will look uneven.',
    );
  });

  it('is silent when every card has the value the shape needs', async () => {
    const [validate] = getDocumentValidators();
    const context = createMockContext(() => [
      { icon: 'CODE' },
      { icon: 'ZAP' },
    ]);

    await expect(
      validate!.fn(
        {
          showImages: true,
          imageShape: CARD_IMAGE_SHAPE.ICON,
          features: [{ _ref: 'card-1' }, { _ref: 'card-2' }],
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(true);
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
