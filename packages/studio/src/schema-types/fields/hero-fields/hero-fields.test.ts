import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config/constants';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import {
  HERO_FIELDSET_CONTENT_POSITION,
  heroFields,
  heroFieldsets,
} from './hero-fields';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (fields: ReturnType<typeof heroFields>, name: string) => {
  const field = fields.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected heroFields() to define a "${name}" field.`);
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

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
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

describe('heroFieldsets', () => {
  it('declares one contentPosition fieldset', () => {
    expect(heroFieldsets).toEqual([
      expect.objectContaining({ name: HERO_FIELDSET_CONTENT_POSITION }),
    ]);
  });
});

describe('heroFields variant field', () => {
  it('offers Split, Stacked and Banner by default, defaulting to Split', () => {
    const field = getField(heroFields(), 'variant');

    expect(getOptionValues(field)).toEqual([
      HERO_VARIANT.SPLIT,
      HERO_VARIANT.STACKED,
      HERO_VARIANT.BANNER,
    ]);
    expect(field.initialValue).toBe(HERO_VARIANT.SPLIT);
  });

  it('is a required dropdown that drives which other fields show', () => {
    const field = getField(heroFields(), 'variant');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('describes what each variant looks like', () => {
    const field = getField(heroFields(), 'variant') as { description?: string };

    expect(field.description).toBeTruthy();
    expect(field.description).toMatch(/split/i);
    expect(field.description).toMatch(/stacked/i);
    expect(field.description).toMatch(/banner/i);
  });

  it('restricts the option set to the given variants', () => {
    const field = getField(
      heroFields({ variants: [HERO_VARIANT.STACKED] }),
      'variant',
    );

    expect(getOptionValues(field)).toEqual([HERO_VARIANT.STACKED]);
    expect(field.initialValue).toBe(HERO_VARIANT.STACKED);
  });
});

describe('heroFields image field', () => {
  it('is included by default', () => {
    const fields = heroFields();

    expect(
      fields.some((field) => 'name' in field && field.name === 'image'),
    ).toBe(true);
  });

  it('is suppressed entirely when image: false', () => {
    const fields = heroFields({ image: false });

    expect(
      fields.some((field) => 'name' in field && field.name === 'image'),
    ).toBe(false);
  });

  it('requires an image for Split and Banner, not Stacked', () => {
    const validate = getCustomValidator<TCustomFn>(
      getField(heroFields(), 'image'),
    );

    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.SPLIT } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.BANNER } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.STACKED } }),
    ).toBe(true);
  });

  it('is valid when an image is present, regardless of variant', () => {
    const validate = getCustomValidator<TCustomFn>(
      getField(heroFields(), 'image'),
    );

    expect(
      validate(
        { asset: { _ref: 'image-abc' } },
        { parent: { variant: HERO_VARIANT.SPLIT } },
      ),
    ).toBe(true);
  });

  it('describes what the image is for without naming variant values as validation', () => {
    const field = getField(heroFields(), 'image') as { description?: string };

    expect(field.description).toBeTruthy();
    expect(field.description).not.toMatch(/required/i);
    expect(field.description).not.toMatch(/SPLIT|STACKED|BANNER/);
  });
});

describe('heroFields content position fields', () => {
  it('shows contentPositionSplit only for Split, and tags it into the shared fieldset', () => {
    const field = getField(heroFields(), 'contentPositionSplit');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('shows contentPositionBanner only for Banner, and tags it into the shared fieldset', () => {
    const field = getField(heroFields(), 'contentPositionBanner');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('always emits the contentAlignment baseline, tagged into the shared fieldset', () => {
    const fields = heroFields();
    const field = getField(fields, 'contentAlignment') as {
      fieldset?: string;
    };

    expect(field.fieldset).toBe(HERO_FIELDSET_CONTENT_POSITION);
  });

  it('defaults contentAlignment to Left', () => {
    expect(getField(heroFields(), 'contentAlignment').initialValue).toBe(
      CONTENT_ALIGNMENT.LEFT,
    );
  });
});

describe('heroFields media order fields', () => {
  it('shows mediaOrderSplit only for Split, defaulting to Last', () => {
    const field = getField(heroFields(), 'mediaOrderSplit');
    const hidden = getHidden(field);

    expect(getOptionValues(field)).toEqual([
      MEDIA_ORDER.LAST,
      MEDIA_ORDER.FIRST,
    ]);
    expect(field.initialValue).toBe(MEDIA_ORDER.LAST);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(getLayout(field)).toBe('dropdown');
    expect(field.validation).toBeUndefined();
  });

  it('shows mediaOrderStacked only for Stacked, defaulting to Last', () => {
    const field = getField(heroFields(), 'mediaOrderStacked');
    const hidden = getHidden(field);

    expect(getOptionValues(field)).toEqual([
      MEDIA_ORDER.LAST,
      MEDIA_ORDER.FIRST,
    ]);
    expect(field.initialValue).toBe(MEDIA_ORDER.LAST);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(getLayout(field)).toBe('dropdown');
    expect(field.validation).toBeUndefined();
  });

  it('Banner emits neither media order field', () => {
    const fields = heroFields();

    for (const name of ['mediaOrderSplit', 'mediaOrderStacked']) {
      const hidden = getHidden(getField(fields, name));
      expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    }
  });

  it('is suppressed entirely when mediaOrderStacked: false, leaving mediaOrderSplit', () => {
    const fields = heroFields({ mediaOrderStacked: false });

    expect(
      fields.some(
        (field) => 'name' in field && field.name === 'mediaOrderStacked',
      ),
    ).toBe(false);
    expect(
      fields.some(
        (field) => 'name' in field && field.name === 'mediaOrderSplit',
      ),
    ).toBe(true);
  });
});

describe('heroFields shared tail', () => {
  it('ends with the layout field, and emits no ctaButtons field', () => {
    const names = heroFields()
      .filter(
        (field): field is typeof field & { name: string } => 'name' in field,
      )
      .map((field) => field.name);

    expect(names.at(-1)).toBe('layout');
    expect(names).not.toContain('ctaButtons');
  });
});
