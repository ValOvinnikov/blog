import type * as BlogConfig from '@blog/config';
import {
  VOICE_FIELD_ERROR,
  VOICE_FIELDS,
  type TVoiceFieldFailuresByLocale,
} from '@blog/config';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  SPINNER_STYLE,
} from '@blog/config/constants';
import type { TSiteConfigResult } from '@blog/db/queries/site-config/get-site-config';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  DEFAULT_CONTROL_STYLES,
  MOCK_ACCENT_HUE,
  MOCK_NOT_FOUND_HEADING,
  MOCK_SITE_CONFIG_FIELDS,
} from '@blog/db/testing/site-config/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import {
  upsertSiteConfig,
  type TUpdateSiteConfigInput,
  type TUpsertSiteConfigResult,
  type TVoiceOverridesInput,
} from './upsert-site-config';

faker.seed(6022);

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

const NOT_FOUND_HEADING_ID = 'notFoundHeading';
const SUPPORTING_TEXT_ID = 'notFoundSupportingText';

function voiceFieldMax(id: string): number {
  const field = VOICE_FIELDS.find((candidate) => candidate.id === id);
  if (!field) throw new Error(`voiceFieldMax: no voice field "${id}".`);
  return field.max;
}

const NOT_FOUND_HEADING_MAX = voiceFieldMax(NOT_FOUND_HEADING_ID);
const SUPPORTING_TEXT_MAX = voiceFieldMax(SUPPORTING_TEXT_ID);
const CHANGED_ACCENT_HUE = MOCK_ACCENT_HUE - 1;
const MOCK_LOGO_HUE = MOCK_ACCENT_HUE - 2;
const MOCK_UNKNOWN_VALUE = faker.lorem.word();
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_FR_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_TOPIC_EMPTY_TEXT = faker.lorem.sentence();
const MOCK_UNKNOWN_PLACEHOLDER_TEXT = `${faker.lorem.words(2)} {${MOCK_UNKNOWN_VALUE}}`;
const MOCK_LOGO_ASSET_URL = faker.internet.url();
const MOCK_FAVICON_ASSET_URL = faker.internet.url();
const MOCK_LINK_HREF = faker.internet.url();
const MOCK_MULTILINE_TEXT = `${faker.lorem.word()}\n${faker.lorem.word()}`;
const MOCK_UNSAFE_HREF = 'javascript:alert(1)';
const MOCK_RICH_LINK_KEY = faker.string.uuid();
const MOCK_RICH_BLOCK_KEY = faker.string.uuid();
const MOCK_RICH_SPAN_KEY = faker.string.uuid();
const MOCK_NON_RICH_TEXT_VALUE = faker.number.int();
const NAME_PLACEHOLDER = '{name}';

const baseInput: TUpdateSiteConfigInput = MOCK_SITE_CONFIG_FIELDS;

const STYLE_FIELDS = [
  { field: 'languageSwitcherStyle', value: LANGUAGE_SWITCHER_STYLE.CODES },
  { field: 'cardStyle', value: CARD_STYLE.OUTLINED },
  { field: 'headerControlStyle', value: HEADER_CONTROL_STYLE.SOFT },
  { field: 'accountButtonStyle', value: ACCOUNT_BUTTON_STYLE.CIRCLE },
  { field: 'accountPanelStyle', value: ACCOUNT_PANEL_STYLE.HUB },
  { field: 'accountPhonePlacement', value: ACCOUNT_PHONE_PLACEMENT.MENU },
  { field: 'busyButtonStyle', value: BUSY_BUTTON_STYLE.EDGE },
  { field: 'spinnerStyle', value: SPINNER_STYLE.BRAILLE },
] as const;

const NEW_CONFIG_DEFAULTS = [
  {
    preset: PRESET_ID.CONSOLE,
    field: 'cardStyle',
    expected: CARD_STYLE.ACCENT_BAR,
  },
  {
    preset: PRESET_ID.EDITORIAL,
    field: 'cardStyle',
    expected: CARD_STYLE.OUTLINED,
  },
  {
    preset: PRESET_ID.CONSOLE,
    field: 'languageSwitcherStyle',
    expected: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
  },
  {
    preset: PRESET_ID.CONSOLE,
    field: 'headerControlStyle',
    expected: HEADER_CONTROL_STYLE.OUTLINED,
  },
] as const;

const INVALID_INPUTS: [string, Partial<TUpdateSiteConfigInput>][] = [
  ['an accent hue above the maximum', { accentHue: HUE_MAX + 1 }],
  [
    'an unknown language switcher style',
    {
      languageSwitcherStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['languageSwitcherStyle'],
    },
  ],
  [
    'an unknown card style',
    { cardStyle: MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['cardStyle'] },
  ],
  [
    'an unknown header control style',
    {
      headerControlStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['headerControlStyle'],
    },
  ],
  [
    'an unknown account button style',
    {
      accountButtonStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['accountButtonStyle'],
    },
  ],
  [
    'an unknown account panel style',
    {
      accountPanelStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['accountPanelStyle'],
    },
  ],
  [
    'an unknown account phone placement',
    {
      accountPhonePlacement:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['accountPhonePlacement'],
    },
  ],
  [
    'an unknown busy button style',
    {
      busyButtonStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['busyButtonStyle'],
    },
  ],
  [
    'an unknown spinner style',
    {
      spinnerStyle:
        MOCK_UNKNOWN_VALUE as TUpdateSiteConfigInput['spinnerStyle'],
    },
  ],
  [
    'an unknown voice override key',
    {
      voiceOverridesByLocale: {
        [LOCALE_ISO_CODES.EN]: {
          [MOCK_UNKNOWN_VALUE]: MOCK_HEADING,
        } as TVoiceOverridesInput,
      },
    },
  ],
];

const OPTIONAL_COLUMNS = [
  { field: 'logoHue', value: MOCK_LOGO_HUE },
  { field: 'logoAssetUrl', value: MOCK_LOGO_ASSET_URL },
  { field: 'faviconAssetUrl', value: MOCK_FAVICON_ASSET_URL },
] as const;

const OVER_CAP_FIELDS = [
  { id: NOT_FOUND_HEADING_ID, max: NOT_FOUND_HEADING_MAX },
  { id: SYNTHETIC_MULTILINE_FIELD_ID, max: SYNTHETIC_MULTILINE_FIELD_MAX },
  { id: SUPPORTING_TEXT_ID, max: SUPPORTING_TEXT_MAX },
] as const;

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

function mockRichText(
  text: string,
  options?: { marks?: string[]; style?: string; href?: string },
) {
  const markDefs = options?.href
    ? [{ _type: 'link', _key: MOCK_RICH_LINK_KEY, href: options.href }]
    : undefined;

  return [
    {
      _type: 'block',
      _key: MOCK_RICH_BLOCK_KEY,
      style: options?.style ?? 'normal',
      ...(markDefs ? { markDefs } : {}),
      children: [
        {
          _type: 'span',
          _key: MOCK_RICH_SPAN_KEY,
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

  function save(overrides: Partial<TUpdateSiteConfigInput> = {}) {
    return upsertSiteConfig(tenantId, { ...baseInput, ...overrides });
  }

  function saveVoice(overrides: TVoiceOverridesInput) {
    return save({
      voiceOverridesByLocale: { [LOCALE_ISO_CODES.EN]: overrides },
    });
  }

  it('inserts a new row when the tenant has no config yet', async () => {
    const result = expectOk(await save());

    const [row] = await db().select().from(schema.siteConfig);
    expect(result).toEqual({
      ...row,
      logoHue: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });
  });

  it('updates the existing row in place', async () => {
    await save();

    const result = expectOk(
      await save({
        preset: PRESET_ID.EDITORIAL,
        accentHue: CHANGED_ACCENT_HUE,
      }),
    );

    const rows = await db().select().from(schema.siteConfig);
    expect(result.preset).toBe(PRESET_ID.EDITORIAL);
    expect(result.accentHue).toBe(CHANGED_ACCENT_HUE);
    expect(rows).toHaveLength(1);
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertSiteConfig(MOCK_MISSING_TENANT_ID, baseInput),
    ).rejects.toThrow();
  });

  it.each(INVALID_INPUTS)('rejects %s', async (_title, overrides) => {
    await expect(save(overrides)).rejects.toThrow();
  });

  describe('style columns', () => {
    it.each(NEW_CONFIG_DEFAULTS)(
      'gives a new $preset config the default $field',
      async ({ preset, field, expected }) => {
        const result = expectOk(await save({ preset }));

        expect(result[field]).toBe(expected);
      },
    );

    it.each(STYLE_FIELDS)(
      'stores a chosen $field',
      async ({ field, value }) => {
        const result = expectOk(await save({ [field]: value }));

        expect(result[field]).toBe(value);
      },
    );

    it('keeps the card style across a preset change when a save omits it', async () => {
      await save();

      const result = expectOk(await save({ preset: PRESET_ID.EDITORIAL }));

      expect(result.cardStyle).toBe(CARD_STYLE.ACCENT_BAR);
    });

    it.each(Object.values(PRESET_ID))(
      'gives a new %s config the default control styles',
      async (preset) => {
        const result = expectOk(await save({ preset }));

        expect(result).toMatchObject(DEFAULT_CONTROL_STYLES);
      },
    );

    it('keeps the default control styles across a preset change', async () => {
      await save();

      const result = expectOk(await save({ preset: PRESET_ID.EDITORIAL }));

      expect(result).toMatchObject(DEFAULT_CONTROL_STYLES);
    });
  });

  describe('voice field caps', () => {
    it.each(OVER_CAP_FIELDS)(
      'rejects an override longer than the $id cap',
      async ({ id, max }) => {
        const errors = expectFieldErrors(
          await saveVoice({
            [id]: 'x'.repeat(max + 1),
          } as TVoiceOverridesInput),
        );

        expect(errors).toEqual({
          [LOCALE_ISO_CODES.EN]: {
            [id]: {
              reason: VOICE_FIELD_ERROR.TOO_LONG,
              values: { max },
            },
          },
        });
      },
    );
  });

  describe('TEXT voice fields', () => {
    it('stores a trimmed override', async () => {
      const result = expectOk(
        await saveVoice({ notFoundHeading: `  ${MOCK_HEADING}  ` }),
      );

      expect(result.voiceOverrides).toEqual({ notFoundHeading: MOCK_HEADING });
    });

    it('rejects an override containing a line break', async () => {
      const errors = expectFieldErrors(
        await saveVoice({ notFoundHeading: MOCK_MULTILINE_TEXT }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundHeading: { reason: VOICE_FIELD_ERROR.LINE_BREAK },
        },
      });
    });

    it('clears a set override when resubmitted blank', async () => {
      await saveVoice({ notFoundHeading: MOCK_HEADING });

      const result = expectOk(await saveVoice({ notFoundHeading: '   ' }));

      expect(result.voiceOverrides).toEqual({});
    });

    it('rejects a placeholder token the registry does not declare', async () => {
      const errors = expectFieldErrors(
        await saveVoice({ notFoundHeading: MOCK_UNKNOWN_PLACEHOLDER_TEXT }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundHeading: {
            reason: VOICE_FIELD_ERROR.UNKNOWN_PLACEHOLDER,
            values: { placeholders: `{${MOCK_UNKNOWN_VALUE}}`, count: 1 },
          },
        },
      });
    });
  });

  describe('MULTILINE voice fields', () => {
    it('stores a trimmed override and keeps its line breaks', async () => {
      const result = expectOk(
        await saveVoice({
          [SYNTHETIC_MULTILINE_FIELD_ID]: `  ${MOCK_MULTILINE_TEXT}  `,
        } as TVoiceOverridesInput),
      );

      expect(result.voiceOverrides).toEqual({
        [SYNTHETIC_MULTILINE_FIELD_ID]: MOCK_MULTILINE_TEXT,
      });
    });
  });

  describe('RICH voice fields', () => {
    it('stores rich text with an allowed mark and a link', async () => {
      const richText = mockRichText(MOCK_SUPPORTING_TEXT, {
        marks: ['strong', MOCK_RICH_LINK_KEY],
        href: MOCK_LINK_HREF,
      });

      const result = expectOk(
        await saveVoice({ notFoundSupportingText: richText }),
      );

      expect(result.voiceOverrides).toEqual({
        notFoundSupportingText: richText,
      });
    });

    it.each([
      ['a disallowed mark', { marks: ['underline'] }],
      ['a disallowed style', { style: 'h2' }],
    ])('rejects rich text carrying %s', async (_title, options) => {
      const errors = expectFieldErrors(
        await saveVoice({
          notFoundSupportingText: mockRichText(MOCK_SUPPORTING_TEXT, options),
        }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundSupportingText: {
            reason: VOICE_FIELD_ERROR.DISALLOWED_CONTENT,
          },
        },
      });
    });

    it('rejects rich text with an unsafe link href', async () => {
      const errors = expectFieldErrors(
        await saveVoice({
          notFoundSupportingText: mockRichText(MOCK_SUPPORTING_TEXT, {
            marks: [MOCK_RICH_LINK_KEY],
            href: MOCK_UNSAFE_HREF,
          }),
        }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundSupportingText: {
            reason: VOICE_FIELD_ERROR.INVALID_LINK_URL,
            values: { url: MOCK_UNSAFE_HREF },
          },
        },
      });
    });

    it.each([
      ['an empty array', []],
      ['a blank string', '   '],
    ])('clears a set override resubmitted as %s', async (_title, blank) => {
      await saveVoice({
        notFoundSupportingText: mockRichText(MOCK_SUPPORTING_TEXT),
      });

      const result = expectOk(
        await saveVoice({ notFoundSupportingText: blank }),
      );

      expect(result.voiceOverrides).toEqual({});
    });

    it('rejects a value that is neither a string nor an array', async () => {
      const errors = expectFieldErrors(
        await saveVoice({ notFoundSupportingText: MOCK_NON_RICH_TEXT_VALUE }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundSupportingText: { reason: VOICE_FIELD_ERROR.NOT_RICH_TEXT },
        },
      });
    });

    it.each([
      ['a plain string', MOCK_SUPPORTING_TEXT, MOCK_SUPPORTING_TEXT],
      [
        'a whitespace-padded string',
        `  ${MOCK_SUPPORTING_TEXT}  \n`,
        MOCK_SUPPORTING_TEXT,
      ],
      [
        'a string over the cap only because of its padding',
        `  ${'x'.repeat(SUPPORTING_TEXT_MAX)}  `,
        'x'.repeat(SUPPORTING_TEXT_MAX),
      ],
    ])('stores %s as one normal block', async (_title, input, text) => {
      const result = expectOk(
        await saveVoice({ notFoundSupportingText: input }),
      );

      const stored = result.voiceOverrides.notFoundSupportingText;
      const [block] = Array.isArray(stored) ? stored : [];
      const [span] = block?.children ?? [];
      expect(stored).toEqual([
        {
          _type: 'block',
          _key: block?._key,
          style: 'normal',
          children: [{ _type: 'span', _key: span?._key, text }],
        },
      ]);
    });

    it.each([
      ['a padded string', `  ${'x'.repeat(SUPPORTING_TEXT_MAX + 1)}  `],
      ['rich text', mockRichText('x'.repeat(SUPPORTING_TEXT_MAX + 1))],
    ])('rejects %s over the cap', async (_title, input) => {
      const errors = expectFieldErrors(
        await saveVoice({ notFoundSupportingText: input }),
      );

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundSupportingText: {
            reason: VOICE_FIELD_ERROR.TOO_LONG,
            values: { max: SUPPORTING_TEXT_MAX },
          },
        },
      });
    });
  });

  describe('voice placeholders', () => {
    it.each([
      ['a string', MOCK_TOPIC_EMPTY_TEXT],
      ['rich text', mockRichText(MOCK_TOPIC_EMPTY_TEXT)],
    ])('rejects %s missing a declared placeholder', async (_title, input) => {
      const errors = expectFieldErrors(await saveVoice({ topicEmpty: input }));

      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          topicEmpty: {
            reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
            values: { placeholders: NAME_PLACEHOLDER, count: 1 },
          },
        },
      });
    });

    it('stores a value that includes every declared placeholder', async () => {
      const richText = mockRichText(
        `${MOCK_TOPIC_EMPTY_TEXT} ${NAME_PLACEHOLDER}`,
      );

      const result = expectOk(await saveVoice({ topicEmpty: richText }));

      expect(result.voiceOverrides).toEqual({ topicEmpty: richText });
    });
  });

  describe('per-language voice overrides', () => {
    it('stores each language a save carries under that language', async () => {
      const result = expectOk(
        await save({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.DE]: {
              notFoundHeading: `  ${MOCK_NOT_FOUND_HEADING}  `,
            },
            [LOCALE_ISO_CODES.FR]: { notFoundHeading: MOCK_FR_HEADING },
          },
        }),
      );

      expect(result.voiceOverridesByLocale).toEqual({
        [LOCALE_ISO_CODES.DE]: { notFoundHeading: MOCK_NOT_FOUND_HEADING },
        [LOCALE_ISO_CODES.FR]: { notFoundHeading: MOCK_FR_HEADING },
      });
    });

    it('leaves the default language slice empty when it is not carried', async () => {
      const result = expectOk(
        await save({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.DE]: { notFoundHeading: MOCK_NOT_FOUND_HEADING },
          },
        }),
      );

      expect(result.voiceOverrides).toEqual({});
    });

    it('returns field errors per language and writes nothing', async () => {
      const errors = expectFieldErrors(
        await save({
          voiceOverridesByLocale: {
            [LOCALE_ISO_CODES.EN]: {
              notFoundHeading: 'x'.repeat(NOT_FOUND_HEADING_MAX + 1),
            },
            [LOCALE_ISO_CODES.DE]: { topicEmpty: MOCK_TOPIC_EMPTY_TEXT },
            [LOCALE_ISO_CODES.FR]: { notFoundHeading: MOCK_FR_HEADING },
          },
        }),
      );

      const rows = await db().select().from(schema.siteConfig);
      expect(errors).toEqual({
        [LOCALE_ISO_CODES.EN]: {
          notFoundHeading: {
            reason: VOICE_FIELD_ERROR.TOO_LONG,
            values: { max: NOT_FOUND_HEADING_MAX },
          },
        },
        [LOCALE_ISO_CODES.DE]: {
          topicEmpty: {
            reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
            values: { placeholders: NAME_PLACEHOLDER, count: 1 },
          },
        },
      });
      expect(rows).toEqual([]);
    });
  });

  describe('partial updates', () => {
    it('keeps voice overrides when a later save omits them', async () => {
      await saveVoice({ notFoundHeading: MOCK_HEADING });

      const result = expectOk(await save({ accentHue: CHANGED_ACCENT_HUE }));

      expect(result.voiceOverrides).toEqual({ notFoundHeading: MOCK_HEADING });
    });

    it('clears a language voice overrides when saved with {}', async () => {
      await saveVoice({ notFoundHeading: MOCK_HEADING });

      const result = expectOk(await saveVoice({}));

      expect(result.voiceOverrides).toEqual({});
    });

    it.each([...STYLE_FIELDS, ...OPTIONAL_COLUMNS])(
      'keeps $field when a later save omits it',
      async ({ field, value }) => {
        await save({ [field]: value });

        const result = expectOk(await save({ accentHue: CHANGED_ACCENT_HUE }));

        expect(result[field]).toBe(value);
      },
    );

    it.each(OPTIONAL_COLUMNS)(
      'clears $field when explicitly saved as null',
      async ({ field, value }) => {
        await save({ [field]: value });

        const result = expectOk(await save({ [field]: null }));

        expect(result[field]).toBeUndefined();
      },
    );
  });
});
