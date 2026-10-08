import {
  clearSettingsDraft,
  readSettingsDraft,
  settingsDraftStorageKey,
  writeSettingsDraft,
  type TStoredSettingsDraft,
} from './settings-draft-storage';

const KEY = settingsDraftStorageKey({ tenantId: 'tenant-1', page: 'voice' });

const DRAFT: TStoredSettingsDraft = {
  values: { tagline: 'Mine' },
  baseline: { tagline: 'Old' },
  takenAt: '2026-10-08T10:42:00.000Z',
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
  throw new Error('blocked');
};

describe('settings draft storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createMemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads back a written draft', () => {
    writeSettingsDraft(KEY, DRAFT);

    expect(readSettingsDraft(KEY)).toEqual(DRAFT);
  });

  it('reads nothing once the draft is cleared', () => {
    writeSettingsDraft(KEY, DRAFT);
    clearSettingsDraft(KEY);

    expect(readSettingsDraft(KEY)).toBeNull();
  });

  it.each([
    ['tenant', { tenantId: 'tenant-2', page: 'voice' }],
    ['page', { tenantId: 'tenant-1', page: 'features' }],
    ['language', { tenantId: 'tenant-1', page: 'voice', language: 'DE' }],
  ])('keeps a draft apart per %s', (_, key) => {
    writeSettingsDraft(KEY, DRAFT);

    expect(readSettingsDraft(settingsDraftStorageKey(key))).toBeNull();
  });

  it.each([
    ['unparseable JSON', '{not json'],
    ['a draft with no time', JSON.stringify({ values: {}, baseline: {} })],
    [
      'a draft with an invalid time',
      JSON.stringify({ values: {}, baseline: {}, takenAt: 'yesterday' }),
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

    expect(() => writeSettingsDraft(KEY, DRAFT)).not.toThrow();
    expect(() => clearSettingsDraft(KEY)).not.toThrow();
    expect(readSettingsDraft(KEY)).toBeNull();
  });
});
