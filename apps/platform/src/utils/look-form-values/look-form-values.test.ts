import { RADIUS_SCALE } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import {
  countChanges,
  isFieldChanged,
  listLostStagedFiles,
} from './look-form-values';

faker.seed(1);

const MOCK_LOGO_FILE = new File([faker.lorem.word()], faker.system.fileName(), {
  type: 'image/png',
});
const MOCK_STAGED_FAVICON_URL = faker.internet.url();

describe(isFieldChanged, () => {
  it('treats an equal plain field as unchanged', () => {
    const a = defaultLookFormValues();

    expect(isFieldChanged('accentHue', a, { ...a })).toBe(false);
  });

  it('treats a different plain field as changed', () => {
    const a = defaultLookFormValues();
    const b = { ...a, accentHue: a.accentHue + 1 };

    expect(isFieldChanged('accentHue', a, b)).toBe(true);
  });

  it('treats a brand image with the same url and file as unchanged', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL } };

    expect(isFieldChanged('logo', a, b)).toBe(false);
  });

  it('treats a newly staged file as a change', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL, file: MOCK_LOGO_FILE } };

    expect(isFieldChanged('logo', a, b)).toBe(true);
  });
});

describe(countChanges, () => {
  it('counts nothing between equal values', () => {
    const a = defaultLookFormValues();

    expect(countChanges(a, defaultLookFormValues())).toBe(0);
  });

  it('counts each changed field once, brand images included', () => {
    const a = defaultLookFormValues();
    const b = {
      ...a,
      accentHue: a.accentHue + 1,
      radiusScale: RADIUS_SCALE.XL,
      favicon: { url: MOCK_STAGED_FAVICON_URL, file: MOCK_LOGO_FILE },
    };

    expect(countChanges(a, b)).toBe(3);
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
