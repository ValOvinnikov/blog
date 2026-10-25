import type * as BlogConfig from '@blog/config';
import {
  VOICE_FIELD_ERROR,
  type TVoiceFieldFailuresByLocale,
} from '@blog/config';
import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import type { TSiteConfigResult } from '@blog/db/queries/site-config/get-site-config';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import {
  upsertSiteConfig,
  type TUpdateSiteConfigInput,
  type TUpsertSiteConfigResult,
  type TVoiceOverridesInput,
} from './upsert-site-config';

const { SYNTHETIC_MULTILINE_FIELD_ID, SYNTHETIC_MULTILINE_FIELD_MAX } =
  vi.hoisted(() => ({
    SYNTHETIC_MULTILINE_FIELD_ID: 'testMultilineField',
    SYNTHETIC_MULTILINE_FIELD_MAX: 300,
  }));

vi.mock('@blog/db/client');

vi.mock('@blog/config', async (importOriginal) => {
  const actual = await importOriginal<typeof BlogConfig>();
  return {
    ...actual,
    VOICE_FIELDS: [
      ...actual.VOICE_FIELDS,
      {
        id: SYNTHETIC_MULTILINE_FIELD_ID,
        path: 'test.multilineField',
        kind: actual.VOICE_FIELD_KIND.MULTILINE,
        surface: actual.VOICE_SURFACE.ERROR,
        placeholders: [],
        max: SYNTHETIC_MULTILINE_FIELD_MAX,
      },
    ],
  };
});

const db = useQueryTestDb();

const CUSTOM_HEADING = 'Custom heading';
const UNSAFE_HREF = 'javascript:alert(1)';
const SUPPORTING_TEXT = 'Try the homepage instead.';
const TOPIC_EMPTY_TEXT = 'Nothing published under this topic yet.';
const LOGO_ASSET_URL = 'https://blob.example.com/logo.png';
const LOST_THE_PLOT = 'Lost the plot?';
const NICHT_GEFUNDEN = 'Nicht gefunden';
const MULTILINE_TEXT = 'Line one\nLine two';

const baseInput: TUpdateSiteConfigInput = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

function expectOk(result: TUpsertSiteConfigResult): TSiteConfigResult {
  if (!result.ok) {
    throw new Error(
      `Expected an ok result, got field errors: ${JSON.stringify(result.error)}`,
    );
  }
  return result.data;
}

function expectFieldErrors(
  result: TUpsertSiteConfigResult,
): TVoiceFieldFailuresByLocale {
  if (result.ok) {
    throw new Error('Expected a field-errors result, got an ok result.');
  }
  return result.error;
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

afterEach(async () => {
  await db().delete(schema.siteConfig);
  await db().delete(schema.tenants);
});

describe(upsertSiteConfig, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new row when the tenant has no config yet', async () => {
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
    const rows = await db().select().from(schema.siteConfig);
    expect(rows).toHaveLength(1);
  });

  it('rejects an accentHue outside the 0–360 range', async () => {
    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, accentHue: 400 }),
    ).rejects.toThrow();
  });

  it('gives a new config the menu-with-code language switcher style', async () => {
    const result = expectOk(await upsertSiteConfig(tenantId, baseInput));

    expect(result.languageSwitcherStyle).toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });

  it('stores a chosen language switcher style', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      }),
    );

    expect(result.languageSwitcherStyle).toBe(LANGUAGE_SWITCHER_STYLE.CODES);
  });

  it('keeps the language switcher style when a save omits it', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );

    expect(result.languageSwitcherStyle).toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
    );
  });

  it('rejects an unknown language switcher style', async () => {
    const languageSwitcherStyle =
      'DROPDOWN' as TUpdateSiteConfigInput['languageSwitcherStyle'];

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, languageSwitcherStyle }),
    ).rejects.toThrow();
  });

  it('gives a new Console config the accent-bar card style', async () => {
    const result = expectOk(await upsertSiteConfig(tenantId, baseInput));

    expect(result.cardStyle).toBe(CARD_STYLE.ACCENT_BAR);
  });

  it('gives a new Editorial config the outlined card style', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        preset: PRESET_ID.EDITORIAL,
      }),
    );

    expect(result.cardStyle).toBe(CARD_STYLE.OUTLINED);
  });

  it('stores a chosen card style over the preset default', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        cardStyle: CARD_STYLE.OUTLINED,
      }),
    );

    expect(result.cardStyle).toBe(CARD_STYLE.OUTLINED);
  });

  it('keeps the card style when a later save omits it, even across a preset change', async () => {
    await upsertSiteConfig(tenantId, baseInput);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        preset: PRESET_ID.EDITORIAL,
      }),
    );

    expect(result.cardStyle).toBe(CARD_STYLE.ACCENT_BAR);
  });

  it('rejects an unknown card style', async () => {
    const cardStyle = 'SHADOWED' as TUpdateSiteConfigInput['cardStyle'];

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, cardStyle }),
    ).rejects.toThrow();
  });

  it('gives a new config the outlined header control style', async () => {
    const result = expectOk(await upsertSiteConfig(tenantId, baseInput));

    expect(result.headerControlStyle).toBe(HEADER_CONTROL_STYLE.OUTLINED);
  });

  it('stores a chosen header control style', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
      }),
    );

    expect(result.headerControlStyle).toBe(HEADER_CONTROL_STYLE.SOFT);
  });

  it('keeps the header control style when a later save omits it', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
    });

    const result = expectOk(await upsertSiteConfig(tenantId, baseInput));

    expect(result.headerControlStyle).toBe(HEADER_CONTROL_STYLE.PLAIN);
  });

  it('rejects an unknown header control style', async () => {
    const headerControlStyle =
      'GHOST' as TUpdateSiteConfigInput['headerControlStyle'];

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, headerControlStyle }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertSiteConfig('00000000-0000-0000-0000-000000000000', baseInput),
    ).rejects.toThrow();
  });

  it('rejects an unknown voice override key', async () => {
    const voiceOverrides = {
      thisIsNotARegisteredField: 'x',
    } as TVoiceOverridesInput;

    await expect(
      upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: voiceOverrides },
      }),
    ).rejects.toThrow();
  });
});

describe('voice overrides — TEXT fields', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores a trimmed TEXT override', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: `  ${LOST_THE_PLOT}  ` },
        },
      }),
    );

    expect(result.voiceOverrides).toEqual({
      notFoundHeading: LOST_THE_PLOT,
    });
  });

  it('rejects a TEXT override longer than its field-specific cap', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'x'.repeat(101) },
        },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundHeading).toEqual({
      reason: VOICE_FIELD_ERROR.TOO_LONG,
      values: { max: 100 },
    });
  });

  it('rejects a TEXT override containing a line break', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'Lost\nthe plot?' },
        },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundHeading).toEqual({
      reason: VOICE_FIELD_ERROR.LINE_BREAK,
    });
  });

  it('clears a previously-set TEXT override when resubmitted blank', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverridesByLocale: {
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: CUSTOM_HEADING },
      },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: '   ' },
        },
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
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores a trimmed MULTILINE override without rejecting line breaks', async () => {
    const overrides = {
      [SYNTHETIC_MULTILINE_FIELD_ID]: `  ${MULTILINE_TEXT}  `,
    } as TVoiceOverridesInput;

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: overrides },
      }),
    );

    expect(result.voiceOverrides).toEqual({
      [SYNTHETIC_MULTILINE_FIELD_ID]: MULTILINE_TEXT,
    });
  });

  it('rejects a MULTILINE override longer than its field-specific cap', async () => {
    const overrides = {
      [SYNTHETIC_MULTILINE_FIELD_ID]: 'x'.repeat(
        SYNTHETIC_MULTILINE_FIELD_MAX + 1,
      ),
    } as TVoiceOverridesInput;

    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: overrides },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]).toEqual({
      [SYNTHETIC_MULTILINE_FIELD_ID]: {
        reason: VOICE_FIELD_ERROR.TOO_LONG,
        values: { max: SYNTHETIC_MULTILINE_FIELD_MAX },
      },
    });
  });
});

describe('voice overrides — RICH fields', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('stores a valid rich-text override with allowed marks and a link', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: richTextOf('Bold and a link', {
              marks: ['strong'],
              href: 'https://example.com/help',
            }),
          },
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toBeDefined();
  });

  it('rejects rich text carrying a disallowed mark', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: richTextOf('Underlined text', {
              marks: ['underline'],
            }),
          },
        },
      }),
    );

    expect(
      fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    ).toEqual({
      reason: VOICE_FIELD_ERROR.DISALLOWED_CONTENT,
    });
  });

  it('rejects rich text carrying a disallowed style', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: richTextOf('A heading', { style: 'h2' }),
          },
        },
      }),
    );

    expect(
      fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    ).toEqual({
      reason: VOICE_FIELD_ERROR.DISALLOWED_CONTENT,
    });
  });

  it('rejects rich text whose link href does not pass sanitizeHref', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: richTextOf('Click here', {
              marks: ['link-1'],
              href: UNSAFE_HREF,
            }),
          },
        },
      }),
    );

    expect(
      fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    ).toEqual({
      reason: VOICE_FIELD_ERROR.INVALID_LINK_URL,
      values: { url: UNSAFE_HREF },
    });
  });

  it('clears a previously-set rich override when resubmitted empty', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverridesByLocale: {
        [LOCALE_ISO_CODES.EN]: {
          notFoundSupportingText: richTextOf('Custom description.'),
        },
      },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundSupportingText: [] },
        },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
  });
});

describe('voice overrides — RICH fields accept a plain string', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('normalizes a plain string into a single normal block', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: SUPPORTING_TEXT,
          },
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        _type: 'block',
        style: 'normal',
        children: [
          expect.objectContaining({
            _type: 'span',
            text: SUPPORTING_TEXT,
          }),
        ],
      }),
    ]);
  });

  it('drops the key for a blank/whitespace-only string', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundSupportingText: '   ' },
        },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
  });

  it('rejects a string exceeding the field cap, same message as authored rich text', async () => {
    const overlong = 'x'.repeat(301);

    const coerced = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundSupportingText: overlong },
        },
      }),
    );
    const authored = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: richTextOf(overlong),
          },
        },
      }),
    );

    expect(coerced[LOCALE_ISO_CODES.EN]?.notFoundSupportingText).toEqual(
      authored[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    );
  });

  it('catches a placeholder violation in a coerced string', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            topicEmpty: TOPIC_EMPTY_TEXT,
          },
        },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.topicEmpty).toEqual({
      reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
      values: { placeholders: '{name}', count: 1 },
    });
  });

  it('still rejects a non-string, non-array value', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: 42 as unknown as string,
          },
        },
      }),
    );

    expect(
      fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    ).toEqual({
      reason: VOICE_FIELD_ERROR.NOT_RICH_TEXT,
    });
  });

  it('trims a whitespace-padded string before storing it', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            notFoundSupportingText: `  ${SUPPORTING_TEXT}  \n`,
          },
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        children: [expect.objectContaining({ text: SUPPORTING_TEXT })],
      }),
    ]);
  });

  it('accepts a string that only exceeds the cap because of its padding', async () => {
    const atCap = 'x'.repeat(300);

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundSupportingText: `  ${atCap}  ` },
        },
      }),
    );

    expect(result.voiceOverrides.notFoundSupportingText).toEqual([
      expect.objectContaining({
        children: [expect.objectContaining({ text: atCap })],
      }),
    ]);
  });

  it('still rejects a string exceeding the cap after trimming', async () => {
    const overCap = 'x'.repeat(301);

    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundSupportingText: `  ${overCap}  ` },
        },
      }),
    );

    expect(
      fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundSupportingText,
    ).toEqual({
      reason: VOICE_FIELD_ERROR.TOO_LONG,
      values: { max: 300 },
    });
  });
});

describe('voice overrides — placeholders', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('rejects a value missing a placeholder the registry declares', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            topicEmpty: richTextOf(TOPIC_EMPTY_TEXT),
          },
        },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.topicEmpty).toEqual({
      reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
      values: { placeholders: '{name}', count: 1 },
    });
  });

  it('rejects a value carrying a placeholder token the registry does not declare', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'Lost, {name}?' },
        },
      }),
    );

    expect(fieldErrorsByLocale[LOCALE_ISO_CODES.EN]?.notFoundHeading).toEqual({
      reason: VOICE_FIELD_ERROR.UNKNOWN_PLACEHOLDER,
      values: { placeholders: '{name}', count: 1 },
    });
  });

  it('accepts a value that includes every placeholder the registry declares', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            topicEmpty: richTextOf('Nothing published under {name} yet.'),
          },
        },
      }),
    );

    expect(result.voiceOverrides.topicEmpty).toBeDefined();
  });
});

describe('per-language voice overrides', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      locale: LOCALE_ISO_CODES.EN,
    }));
  });

  it('stores each language a save carries under that language', async () => {
    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.DE]: { notFoundHeading: `  ${NICHT_GEFUNDEN}  ` },
          [LOCALE_ISO_CODES.FR]: { notFoundHeading: 'Introuvable' },
        },
      }),
    );

    expect(result.voiceOverridesByLocale).toEqual({
      [LOCALE_ISO_CODES.DE]: { notFoundHeading: NICHT_GEFUNDEN },
      [LOCALE_ISO_CODES.FR]: { notFoundHeading: 'Introuvable' },
    });
    expect(result.voiceOverrides).toEqual({});
  });

  it('returns field errors per language and writes nothing', async () => {
    const fieldErrorsByLocale = expectFieldErrors(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'x'.repeat(101) },
          [LOCALE_ISO_CODES.DE]: { topicEmpty: 'Keine Beiträge in {topic}' },
          [LOCALE_ISO_CODES.FR]: { notFoundHeading: 'Introuvable' },
        },
      }),
    );

    expect(fieldErrorsByLocale).toEqual({
      [LOCALE_ISO_CODES.EN]: {
        notFoundHeading: expect.objectContaining({
          reason: VOICE_FIELD_ERROR.TOO_LONG,
        }),
      },
      [LOCALE_ISO_CODES.DE]: {
        topicEmpty: expect.objectContaining({
          reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
        }),
      },
    });
    expect(await db().select().from(schema.siteConfig)).toEqual([]);
  });
});

describe('partial updates — omission leaves a field untouched, explicit null clears it', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('preserves voice overrides when a later update omits the field entirely', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverridesByLocale: {
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: CUSTOM_HEADING },
      },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );

    expect(result.voiceOverrides).toEqual({
      notFoundHeading: CUSTOM_HEADING,
    });
  });

  it('clears every voice override when explicitly updated with {}', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverridesByLocale: {
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: CUSTOM_HEADING },
      },
    });

    const result = expectOk(
      await upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: {} },
      }),
    );

    expect(result.voiceOverrides).toEqual({});
  });

  it('preserves logoHue when a later update omits the field', async () => {
    await upsertSiteConfig(tenantId, { ...baseInput, logoHue: 200 });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );

    expect(result.logoHue).toBe(200);
  });

  it('clears logoHue back to "follow accentHue" when explicitly set to null', async () => {
    await upsertSiteConfig(tenantId, { ...baseInput, logoHue: 200 });

    const result = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, logoHue: null }),
    );

    expect(result.logoHue).toBeUndefined();
  });

  it('preserves logoAssetUrl on omission and clears it on explicit null', async () => {
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      logoAssetUrl: LOGO_ASSET_URL,
    });

    const survived = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, accentHue: 28 }),
    );
    expect(survived.logoAssetUrl).toBe(LOGO_ASSET_URL);

    const cleared = expectOk(
      await upsertSiteConfig(tenantId, { ...baseInput, logoAssetUrl: null }),
    );
    expect(cleared.logoAssetUrl).toBeUndefined();
  });
});
