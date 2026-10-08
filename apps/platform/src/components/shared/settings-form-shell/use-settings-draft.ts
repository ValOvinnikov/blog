'use client';

import {
  clearSettingsDraft,
  readSettingsDraft,
  settingsDraftStorageKey,
  writeSettingsDraft,
  type TSettingsDraftKey,
  type TStoredSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from 'react';

type TSettingsDraftField<TValues> = {
  id: string;
  label: string;
  display: (values: TValues) => string;
};

export type TSettingsFormDraft<TValues> = TSettingsDraftKey & {
  values: TValues;
  savedValues: TValues;
  savedAt?: Date;
  fields: TSettingsDraftField<TValues>[];
  onRestore: (values: TValues) => void;
};

export type TDraftDifference = {
  id: string;
  label: string;
  saved: string;
  draft: string;
};

type TDraftOffer<TValues> = {
  values: TValues;
  takenAt: Date;
  changeCount: number;
  differences: TDraftDifference[];
};

// A draft written before a field was added or reshaped can't be displayed
// for every field; it is dropped rather than restored half-formed.
const toOffer = <TValues>(
  stored: TStoredSettingsDraft,
  savedValues: TValues,
  fields: TSettingsDraftField<TValues>[],
): TDraftOffer<TValues> | null => {
  const draftValues = stored.values as TValues;
  const baselineValues = stored.baseline as TValues;

  try {
    const rows = fields.map(({ id, label, display }) => ({
      id,
      label,
      saved: display(savedValues),
      draft: display(draftValues),
      baseline: display(baselineValues),
    }));
    if (rows.some(({ draft, baseline }) => !isString(draft, baseline))) {
      return null;
    }

    const changed = rows.filter(({ saved, draft }) => saved !== draft);
    if (changed.length === 0) return null;

    return {
      values: draftValues,
      takenAt: new Date(stored.takenAt),
      changeCount: changed.length,
      differences: changed
        .filter(({ saved, baseline }) => saved !== baseline)
        .map(({ id, label, saved, draft }) => ({ id, label, saved, draft })),
    };
  } catch {
    return null;
  }
};

const isString = (...candidates: unknown[]) =>
  candidates.every((candidate) => typeof candidate === 'string');

const subscribeToNothing = () => () => {};

export const useSettingsDraft = <TValues>(
  draft: TSettingsFormDraft<TValues>,
  isDirty: boolean,
) => {
  const { values, savedValues, fields, onRestore } = draft;
  const storageKey = settingsDraftStorageKey(draft);
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [storedOnArrival] = useState(() =>
    typeof window === 'undefined' ? null : readSettingsDraft(storageKey),
  );
  const [isOfferSettled, setIsOfferSettled] = useState(false);
  const offer =
    isHydrated && !isOfferSettled && storedOnArrival
      ? toOffer(storedOnArrival, savedValues, fields)
      : null;
  const isOfferPending = offer !== null;
  const valuesSnapshot = JSON.stringify(values);
  const savedSnapshot = JSON.stringify(savedValues);

  const syncStoredDraft = useEffectEvent(() => {
    if (!isDirty) {
      clearSettingsDraft(storageKey);
      return;
    }
    writeSettingsDraft(storageKey, {
      values,
      baseline: savedValues,
      takenAt: new Date().toISOString(),
    });
  });

  useEffect(() => {
    if (!isHydrated || isOfferPending) return;
    syncStoredDraft();
  }, [
    isHydrated,
    isOfferPending,
    storageKey,
    valuesSnapshot,
    savedSnapshot,
    isDirty,
  ]);

  const restore = () => {
    if (!offer) return;
    onRestore(offer.values);
    setIsOfferSettled(true);
  };

  const forget = () => {
    clearSettingsDraft(storageKey);
    setIsOfferSettled(true);
  };

  return { offer, restore, forget };
};
