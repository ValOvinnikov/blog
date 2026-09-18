import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import {
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
} from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { getField } from '@blog/studio/testing/get-field';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';
import { toTitleCase } from '@blog/utils/primitives';

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

describe('ctaButtonSchema control choices', () => {
  it('keeps variant as a visible, required dropdown', () => {
    const field = getField(ctaButtonSchema, 'variant');

    expect(getLayout(field)).toBe('dropdown');
    expect((field as { hidden?: boolean }).hidden).toBeUndefined();
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getOptionValues(field)).toEqual(
      Object.values(CTA_ACTION_VARIANT).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    );
  });

  it('keeps appearance as an optional dropdown', () => {
    const field = getField(ctaButtonSchema, 'appearance');

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
    const field = getField(ctaButtonSchema, 'link');

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
    expect(wasRequiredCalled(field)).toBe(true);
  });
});

describe('ctaButtonSchema preview', () => {
  const prepare = ctaButtonSchema.preview?.prepare;

  it('titles by variant and appearance, subtitles by the external URL', () => {
    expect(
      prepare?.({
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        url: 'https://example.com/start',
        pageType: undefined,
        pageSlug: undefined,
      }),
    ).toEqual({
      title: 'Primary · Contained',
      subtitle: 'https://example.com/start',
    });
  });

  it('subtitles an internal link by the resolved site path', () => {
    expect(
      prepare?.({
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
        url: undefined,
        pageType: 'page_post',
        pageSlug: 'hello-world',
      }),
    ).toEqual({ title: 'Primary · Inline', subtitle: '/blog/hello-world' });
  });

  it('falls back to a placeholder subtitle when no link is set', () => {
    expect(
      prepare?.({
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
        url: undefined,
        pageType: undefined,
        pageSlug: undefined,
      }),
    ).toEqual({ title: 'Secondary · Inline', subtitle: 'No link yet' });
  });
});

describe('ctaButtonSchema copy', () => {
  it('is titled Action and never calls itself a button', () => {
    for (const schema of [ctaButtonSchema, ctaSecondaryButtonSchema]) {
      expect(schema.title).toBe('Action');
      expect(schema.description).not.toMatch(/button/i);
      for (const field of schema.fields) {
        expect(field.title).not.toMatch(/button/i);
        expect(field.description).not.toMatch(/button/i);
      }
    }
  });
});

describe('ctaSecondaryButtonSchema control choices', () => {
  it('fixes variant to Secondary and hides the control', () => {
    const field = getField(ctaSecondaryButtonSchema, 'variant');

    expect(field.initialValue).toBe(CTA_ACTION_VARIANT.SECONDARY);
    expect((field as { hidden?: boolean }).hidden).toBe(true);
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('defaults appearance to Contained, same as ctaButtonSchema', () => {
    const field = getField(ctaSecondaryButtonSchema, 'appearance');

    expect(field.initialValue).toBe(CTA_ACTION_APPEARANCE.CONTAINED);
  });

  it('does not require a link — an empty link means no secondary action', () => {
    const field = getField(ctaSecondaryButtonSchema, 'link');

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
    expect(field.validation).toBeUndefined();
  });

  it('seeds both variant and appearance through the type-level initialValue', () => {
    expect(ctaSecondaryButtonSchema.initialValue).toEqual({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    });
  });
});

describe('ctaSecondaryButtonSchema preview', () => {
  const prepare = ctaSecondaryButtonSchema.preview?.prepare;

  it('titles by variant and appearance, subtitles by the URL', () => {
    expect(
      prepare?.({
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        url: undefined,
        pageType: 'page_home',
        pageSlug: undefined,
      }),
    ).toEqual({ title: 'Secondary · Contained', subtitle: '/' });
  });
});
