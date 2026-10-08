export type TSettingsDraftKey = {
  tenantId: string;
  page: string;
  language?: string;
};

export type TStoredSettingsDraft = {
  values: unknown;
  baseline: unknown;
  takenAt: string;
};

const STORAGE_PREFIX = 'platform.settings-draft.v1';

export const settingsDraftStorageKey = ({
  tenantId,
  page,
  language = '',
}: TSettingsDraftKey): string =>
  [STORAGE_PREFIX, tenantId, page, language].join(':');

const isStoredSettingsDraft = (value: unknown): value is TStoredSettingsDraft =>
  typeof value === 'object' &&
  value !== null &&
  'values' in value &&
  'baseline' in value &&
  'takenAt' in value &&
  typeof value.takenAt === 'string' &&
  !Number.isNaN(Date.parse(value.takenAt));

// Storage can throw on access (blocked site data, private mode, a full
// quota), which only ever disables recovery.
const withStorage = <T>(fallback: T, apply: (storage: Storage) => T): T => {
  try {
    return apply(window.localStorage);
  } catch {
    return fallback;
  }
};

export const readSettingsDraft = (
  storageKey: string,
): TStoredSettingsDraft | null =>
  withStorage(null, (storage) => {
    const raw = storage.getItem(storageKey);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredSettingsDraft(parsed) ? parsed : null;
  });

export const writeSettingsDraft = (
  storageKey: string,
  draft: TStoredSettingsDraft,
): void =>
  withStorage(undefined, (storage) =>
    storage.setItem(storageKey, JSON.stringify(draft)),
  );

export const clearSettingsDraft = (storageKey: string): void =>
  withStorage(undefined, (storage) => storage.removeItem(storageKey));
