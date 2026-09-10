import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  upsertSiteConfig,
  type TUpdateSiteConfigInput,
  type TUpsertSiteConfigResult,
  type TVoiceOverridesInput,
} from './upsert-site-config';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

const { SYNTHETIC_MULTILINE_FIELD_ID, SYNTHETIC_MULTILINE_FIELD_MAX } =
  vi.hoisted(() => ({
    SYNTHETIC_MULTILINE_FIELD_ID: 'testMultilineField',
    SYNTHETIC_MULTILINE_FIELD_MAX: 300,
  }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

// VOICE_FIELDS has no MULTILINE member, so validateTextField's line-break
// branch for non-TEXT fields is only reachable via a synthetic entry here.
vi.mock('@blog/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/config')>();
  return {
    ...actual,
    VOICE_FIELDS: [
      ...actual.VOICE_FIELDS,
      {
        id: SYNTHETIC_MULTILINE_FIELD_ID,
        path: 'test.multilineField',
        kind: actual.VOICE_FIELD_KIND.MULTILINE,
        surface: actual.VOICE_SURFACE.ACCOUNT,
        placeholders: [],
        max: SYNTHETIC_MULTILINE_FIELD_MAX,
      },
    ],
  };
});

let db: PgliteDatabase<typeof schema>;

const baseInput: TUpdateSiteConfigInput = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

function expectOk(
  result: TUpsertSiteConfigResult,
): Extract<TUpsertSiteConfigResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(
      `Expected an ok result, got fieldErrors: ${JSON.stringify(result.fieldErrors)}`,
    );
  }
  return result;
}

function expectFieldErrors(
  result: TUpsertSiteConfigResult,
): Extract<TUpsertSiteConfigResult, { ok: false }> {
  if (result.ok) {
    throw new Error('Expected a field-errors result, got an ok result.');
  }
  return result;
}

function richTextOf(
  text: string,
  options?: { marks?: string[]; style?: string; href?: string },
) {
  const markDefs = options?.href
    ? [{ _type: 'link', _key: 'link-1', href: options.href }]
    : undefined;

  return [
    {
      _type: 'block',
      _key: 'block-1',
      style: options?.style ?? 'normal',
      ...(markDefs ? { markDefs } : {}),
      children: [
        {
          _type: 'span',
          _key: 'span-1',
          text,
          ...(options?.marks ? { marks: options.marks } : {}),
        },
      ],
    },
  ];
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.siteConfig);
  await db.delete(schema.tenants);
});

describe(upsertSiteConfig, () => {
  it('inserts a new row when the tenant has no config yet', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(await upsertSiteConfig(tenantId, baseInput));

    expect(result).toMatchObject({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      voiceOverrides: {},
    });
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, baseInput);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        preset: PRESET_ID.EDITORIAL,
        accentHue: 28,
      }),
    );

    expect(result.preset).toBe(PRESET_ID.EDITORIAL);
    expect(result.accentHue).toBe(28);
    const rows = await db.select().from(schema.siteConfig);
    expect(rows).toHaveLength(1);
  });

  it('rejects an accentHue outside the 0–360 range', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, accentHue: 400 }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertSiteConfig('00000000-0000-0000-0000-000000000000', baseInput),
    ).rejects.toThrow();
  });

  it('rejects an unknown voice override key', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const voiceOverrides = {
      thisIsNotARegisteredField: 'x',
    } as TUpdateSiteConfigInput['voiceOverrides'];

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, voiceOverrides }),
    ).rejects.toThrow();
  });
});

describe('voice overrides — TEXT fields', () => {
  it('stores a trimmed TEXT override', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundHeading: '  Lost the plot?  ' },
      }),
    );

    expect(result.voiceOverrides).toEqual({
      notFoundHeading: 'Lost the plot?',
    });
  });

  it('rejects a TEXT override longer than its field-specific cap', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundHeading: 'x'.repeat(101) },
      }),
    );

    expect(result.fieldErrors.notFoundHeading).toBeDefined();
  });

  it('rejects a TEXT override containing a line break', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundHeading: 'Lost\nthe plot?' },
      }),
    );

    expect(result.fieldErrors.notFoundHeading).toMatch(/line break/i);
  });

  it('clears a previously-set TEXT override when resubmitted blank', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { notFoundHeading: 'Custom heading' },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundHeading: '   ' },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
    expect(
      Object.prototype.hasOwnProperty.call(
        result.voiceOverrides,
        'notFoundHeading',
      ),
    ).toBe(false);
  });
});

describe('voice overrides — MULTILINE fields', () => {
  it('stores a trimmed MULTILINE override without rejecting line breaks', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const overrides = {
      [SYNTHETIC_MULTILINE_FIELD_ID]: '  Line one\nLine two  ',
    } as TVoiceOverridesInput;

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: overrides,
      }),
    );

    expect(result.voiceOverrides).toEqual({
      [SYNTHETIC_MULTILINE_FIELD_ID]: 'Line one\nLine two',
    });
  });

  it('rejects a MULTILINE override longer than its field-specific cap', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const overrides = {
      [SYNTHETIC_MULTILINE_FIELD_ID]: 'x'.repeat(
        SYNTHETIC_MULTILINE_FIELD_MAX + 1,
      ),
    } as TVoiceOverridesInput;

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: overrides,
      }),
    );

    expect(
      result.fieldErrors[
        SYNTHETIC_MULTILINE_FIELD_ID as keyof typeof result.fieldErrors
      ],
    ).toBeDefined();
  });
});

describe('voice overrides — RICH fields', () => {
  it('stores a valid rich-text override with allowed marks and a link', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: richTextOf('Bold and a link', {
            marks: ['strong'],
            href: 'https://example.com/help',
          }),
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toBeDefined();
  });

  it('rejects rich text carrying a disallowed mark', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: richTextOf('Underlined text', {
            marks: ['underline'],
          }),
        },
      }),
    );

    expect(result.fieldErrors.notFoundSupportingText).toMatch(/mark/i);
  });

  it('rejects rich text carrying a disallowed style', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: richTextOf('A heading', { style: 'h2' }),
        },
      }),
    );

    expect(result.fieldErrors.notFoundSupportingText).toMatch(/style/i);
  });

  it('rejects rich text whose link href does not pass sanitizeHref', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: richTextOf('Click here', {
            marks: ['link-1'],
            href: 'javascript:alert(1)',
          }),
        },
      }),
    );

    expect(result.fieldErrors.notFoundSupportingText).toMatch(/link/i);
  });

  it('clears a previously-set rich override when resubmitted empty', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: {
        notFoundSupportingText: richTextOf('Custom description.'),
      },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: [] },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
  });
});

describe('voice overrides — RICH fields accept a plain string', () => {
  it('normalizes a plain string into a single normal block', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: 'Try the homepage instead.' },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        _type: 'block',
        style: 'normal',
        children: [
          expect.objectContaining({
            _type: 'span',
            text: 'Try the homepage instead.',
          }),
        ],
      }),
    ]);
  });

  it('drops the key for a blank/whitespace-only string', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: '   ' },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
  });

  it('rejects a string exceeding the field cap, same message as authored rich text', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const overlong = 'x'.repeat(301);

    const coerced = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: overlong },
      }),
    );
    const authored = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: richTextOf(overlong) },
      }),
    );

    expect(coerced.fieldErrors.notFoundSupportingText).toBe(
      authored.fieldErrors.notFoundSupportingText,
    );
  });

  it('catches a placeholder violation in a coerced string', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          topicEmpty: 'Nothing published under this topic yet.',
        },
      }),
    );

    expect(result.fieldErrors.topicEmpty).toMatch(/missing/i);
    expect(result.fieldErrors.topicEmpty).toContain('{name}');
  });

  it('still rejects a non-string, non-array value', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: 42 as unknown as string,
        },
      }),
    );

    expect(result.fieldErrors.notFoundSupportingText).toBe(
      'Must be rich text.',
    );
  });

  it('trims a whitespace-padded string before storing it', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          notFoundSupportingText: '  Try the homepage instead.  \n',
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        children: [
          expect.objectContaining({ text: 'Try the homepage instead.' }),
        ],
      }),
    ]);
  });

  it('accepts a string that only exceeds the cap because of its padding', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const atCap = 'x'.repeat(300);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: `  ${atCap}  ` },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        children: [expect.objectContaining({ text: atCap })],
      }),
    ]);
  });

  it('still rejects a string exceeding the cap after trimming', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const overCap = 'x'.repeat(301);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundSupportingText: `  ${overCap}  ` },
      }),
    );

    expect(result.fieldErrors.notFoundSupportingText).toBe(
      'Must be 300 characters or fewer.',
    );
  });
});

describe('voice overrides — placeholders', () => {
  it('rejects a value missing a placeholder the registry declares', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          topicEmpty: richTextOf('Nothing published under this topic yet.'),
        },
      }),
    );

    expect(result.fieldErrors.topicEmpty).toMatch(/missing/i);
    expect(result.fieldErrors.topicEmpty).toContain('{name}');
  });

  it('rejects a value carrying a placeholder token the registry does not declare', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { notFoundHeading: 'Lost, {name}?' },
      }),
    );

    expect(result.fieldErrors.notFoundHeading).toMatch(/unknown/i);
    expect(result.fieldErrors.notFoundHeading).toContain('{name}');
  });

  it('accepts a value that includes every placeholder the registry declares', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: {
          topicEmpty: richTextOf('Nothing published under {name} yet.'),
        },
      }),
    );

    expect(result.voiceOverrides.topicEmpty).toBeDefined();
  });
});

// Look and Voice save from separate admin-panel tabs, so a field absent from
// one tab's submission must never overwrite what the other tab already set —
// only an explicit value (or, for nullable columns, an explicit `null`)
// changes anything.
describe('partial updates — omission leaves a field untouched, explicit null clears it', () => {
  it('preserves voice overrides when a later update omits the field entirely', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { notFoundHeading: 'Custom heading' },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );

    expect(result.voiceOverrides).toEqual({
      notFoundHeading: 'Custom heading',
    });
  });

  it('clears every voice override when explicitly updated with {}', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { notFoundHeading: 'Custom heading' },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, voiceOverrides: {} }),
    );

    expect(result.voiceOverrides).toEqual({});
  });

  it('preserves logoHue when a later update omits the field', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, { ...baseInput, logoHue: 200 });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );

    expect(result.logoHue).toBe(200);
  });

  it('clears logoHue back to "follow accentHue" when explicitly set to null', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, { ...baseInput, logoHue: 200 });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, logoHue: null }),
    );

    expect(result.logoHue).toBeUndefined();
  });

  it('preserves logoAssetUrl on omission and clears it on explicit null', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      logoAssetUrl: 'https://blob.example.com/logo.png',
    });

    const survived = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );
    expect(survived.logoAssetUrl).toBe('https://blob.example.com/logo.png');

    const cleared = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, logoAssetUrl: null }),
    );
    expect(cleared.logoAssetUrl).toBeUndefined();
  });
});
