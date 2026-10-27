import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import {
  clearSettingsDraft,
  readSettingsDraft,
  settingsDraftStorageKey,
  writeSettingsDraft,
  type TStoredSettingsDraft,
} from './settings-draft-storage';

faker.seed(1);

const MOCK_PAGE = faker.lorem.word();
const MOCK_OTHER_PAGE = `${MOCK_PAGE}-${faker.lorem.word()}`;
const MOCK_OTHER_TENANT_ID = faker.string.uuid();
const MOCK_INVALID_TIME = faker.string.alpha(12);
const MOCK_BLOCKED_MESSAGE = faker.lorem.sentence();

const KEY = settingsDraftStorageKey({
  tenantId: MOCK_TENANT_ID,
  page: MOCK_PAGE,
});

const MOCK_DRAFT: TStoredSettingsDraft = {
  values: { tagline: faker.lorem.words(2) },
  baseline: { tagline: faker.lorem.words(2) },
  takenAt: faker.date.past().toISOString(),
};

const createMemoryStorage = (): Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
> => {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
};

const throwBlocked = () => {
  throw new Error(MOCK_BLOCKED_MESSAGE);
};

describe('settings draft storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createMemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads back a written draft', () => {
    writeSettingsDraft(KEY, MOCK_DRAFT);

    expect(readSettingsDraft(KEY)).toEqual(MOCK_DRAFT);
  });

  it('reads nothing once the draft is cleared', () => {
    writeSettingsDraft(KEY, MOCK_DRAFT);
    clearSettingsDraft(KEY);

    expect(readSettingsDraft(KEY)).toBeNull();
  });

  it.each([
    ['tenant', { tenantId: MOCK_OTHER_TENANT_ID, page: MOCK_PAGE }],
    ['page', { tenantId: MOCK_TENANT_ID, page: MOCK_OTHER_PAGE }],
    [
      'language',
      {
        tenantId: MOCK_TENANT_ID,
        page: MOCK_PAGE,
        language: LOCALE_ISO_CODES.DE,
      },
    ],
  ])('keeps a draft apart per %s', (_, key) => {
    writeSettingsDraft(KEY, MOCK_DRAFT);

    expect(readSettingsDraft(settingsDraftStorageKey(key))).toBeNull();
  });

  it.each([
    ['unparseable JSON', faker.lorem.word()],
    ['a draft with no time', JSON.stringify({ values: {}, baseline: {} })],
    [
      'a draft with an invalid time',
      JSON.stringify({ values: {}, baseline: {}, takenAt: MOCK_INVALID_TIME }),
    ],
  ])('reads nothing from %s', (_, raw) => {
    window.localStorage.setItem(KEY, raw);

    expect(readSettingsDraft(KEY)).toBeNull();
  });

  it.each([
    [
      'storage throws',
      {
        localStorage: {
          getItem: throwBlocked,
          setItem: throwBlocked,
          removeItem: throwBlocked,
        },
      },
    ],
    ['there is no window', undefined],
  ])('degrades to no draft when %s', (_, stubbedWindow) => {
    vi.stubGlobal('window', stubbedWindow);

    expect(() => writeSettingsDraft(KEY, MOCK_DRAFT)).not.toThrow();
    expect(() => clearSettingsDraft(KEY)).not.toThrow();
    expect(readSettingsDraft(KEY)).toBeNull();
  });
});
