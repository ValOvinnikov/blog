import { faker } from '@faker-js/faker';
import { FREE_LOOK_FIELDS } from '@platform/testing/look/look-form-fixtures';
import {
  MOCK_FAVICON_URL,
  MOCK_LOGO_DARK_URL,
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';
import { mockTenantEntitlements } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { PRESET_ID, RADIUS_SCALE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MOCK_PINK_HEX } from '@shinefold/config/testing/button-colors';
import { MOCK_SHINEFOLD_PRESET_GRANT } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';

import {
  countChanges,
  isFieldChanged,
  listLostStagedFiles,
  restoreLookDraft,
  toLookFormValuesWithin,
} from './look-form-values';

faker.seed(1);

const MOCK_LOGO_FILE = new File([faker.lorem.word()], faker.system.fileName(), {
  type: 'image/png',
});
const MOCK_STAGED_FAVICON_URL = faker.internet.url();

const DEFAULT_VALUES = defaultLookFormValues();
const MOCK_WITH_LOGO = { ...DEFAULT_VALUES, logo: { url: MOCK_LOGO_URL } };

describe(isFieldChanged, () => {
  it('treats an equal plain field as unchanged', () => {
    expect(
      isFieldChanged('accentHue', DEFAULT_VALUES, { ...DEFAULT_VALUES }),
    ).toBe(false);
  });

  it('treats a different plain field as changed', () => {
    const b = { ...DEFAULT_VALUES, accentHue: DEFAULT_VALUES.accentHue + 1 };

    expect(isFieldChanged('accentHue', DEFAULT_VALUES, b)).toBe(true);
  });

  it('treats a brand image with the same url and file as unchanged', () => {
    const b = { ...MOCK_WITH_LOGO, logo: { url: MOCK_LOGO_URL } };

    expect(isFieldChanged('logo', MOCK_WITH_LOGO, b)).toBe(false);
  });

  it('treats a newly staged file as a change', () => {
    const b = {
      ...MOCK_WITH_LOGO,
      logo: { url: MOCK_LOGO_URL, file: MOCK_LOGO_FILE },
    };

    expect(isFieldChanged('logo', MOCK_WITH_LOGO, b)).toBe(true);
  });
});

describe(countChanges, () => {
  it('counts nothing between equal values', () => {
    expect(countChanges(DEFAULT_VALUES, defaultLookFormValues())).toBe(0);
  });

  it('counts each changed field once, brand images included', () => {
    const b = {
      ...DEFAULT_VALUES,
      accentHue: DEFAULT_VALUES.accentHue + 1,
      radiusScale: RADIUS_SCALE.XL,
      favicon: { url: MOCK_STAGED_FAVICON_URL, file: MOCK_LOGO_FILE },
    };

    expect(countChanges(DEFAULT_VALUES, b)).toBe(3);
  });
});

describe(listLostStagedFiles, () => {
  it('lists every brand image that was staged as a file', () => {
    const draft = {
      ...defaultLookFormValues(),
      logo: { url: MOCK_STAGED_LOGO_BLOB_URL, file: {} as File },
      favicon: { url: MOCK_LOGO_URL },
    };

    expect(listLostStagedFiles(draft)).toEqual(['logo']);
  });

  it('lists nothing when no file was staged', () => {
    expect(listLostStagedFiles(defaultLookFormValues())).toEqual([]);
  });
});

describe(restoreLookDraft, () => {
  const current = {
    ...MOCK_WITH_LOGO,
    logoDark: { url: MOCK_LOGO_DARK_URL },
    favicon: { url: MOCK_FAVICON_URL },
  };
  const draft = {
    ...DEFAULT_VALUES,
    logo: { url: MOCK_STAGED_LOGO_BLOB_URL },
    logoDark: { url: MOCK_STAGED_LOGO_BLOB_URL },
    favicon: { url: MOCK_STAGED_FAVICON_URL },
  };

  it("keeps the form's current brand images over the draft's", () => {
    const restored = restoreLookDraft(draft, current, {
      lookFields: FREE_LOOK_FIELDS,
      unlockedPresets: [],
    });

    expect(restored).toMatchObject({
      logo: { url: MOCK_LOGO_URL },
      logoDark: { url: MOCK_LOGO_DARK_URL },
      favicon: { url: MOCK_FAVICON_URL },
    });
  });
});

describe(toLookFormValuesWithin, () => {
  const SHINEFOLD_VALUES = { ...DEFAULT_VALUES, preset: PRESET_ID.SHINEFOLD };
  const GROWTH = mockTenantEntitlements(TENANT_PLAN.GROWTH, [
    MOCK_SHINEFOLD_PRESET_GRANT,
  ]);
  const FREE = mockTenantEntitlements(TENANT_PLAN.FREE, [
    MOCK_SHINEFOLD_PRESET_GRANT,
  ]);
  const SAVED_VALUES = { ...SHINEFOLD_VALUES, buttonColor: MOCK_PINK_HEX };

  it('leaves an unsaved Shinefold button colour following the preset', () => {
    expect(toLookFormValuesWithin(SHINEFOLD_VALUES, GROWTH).buttonColor).toBe(
      undefined,
    );
  });

  it('keeps a saved button colour', () => {
    expect(toLookFormValuesWithin(SAVED_VALUES, GROWTH).buttonColor).toBe(
      MOCK_PINK_HEX,
    );
  });

  it('follows the preset while the button colour is locked', () => {
    expect(toLookFormValuesWithin(SAVED_VALUES, FREE).buttonColor).toBe(
      undefined,
    );
  });
});
