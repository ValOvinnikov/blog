'use client';

import {
  toDraftOffer,
  type TSettingsDraftField,
} from '@platform/utils/settings-draft-offer/settings-draft-offer';
import {
  clearSettingsDraft,
  readSettingsDraft,
  settingsDraftStorageKey,
  writeSettingsDraft,
  type TSettingsDraftKey,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from 'react';

export type TSettingsFormDraft<TValues> = TSettingsDraftKey & {
  values: TValues;
  savedValues: TValues;
  savedAt?: Date;
  fields: TSettingsDraftField<TValues>[];
  onRestore: (values: TValues) => void;
};

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
      ? toDraftOffer(storedOnArrival, savedValues, fields)
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
