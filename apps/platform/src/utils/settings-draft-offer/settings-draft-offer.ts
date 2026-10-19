import type { TMaybeNull } from '@blog/config';
import type { TStoredSettingsDraft } from '@platform/utils/settings-draft-storage/settings-draft-storage';

export type TSettingsDraftField<TValues> = {
  id: string;
  label: string;
  display: (values: TValues) => string;
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
// for every field; it is dropped rather than restored half-formed. JSON drops
// `undefined`, so only a key the saved values define has to be present.
export const toDraftOffer = <TValues>(
  stored: TStoredSettingsDraft,
  savedValues: TValues,
  fields: TSettingsDraftField<TValues>[],
): TMaybeNull<TDraftOffer<TValues>> => {
  if (!hasEveryKey(savedValues, stored.values, stored.baseline)) return null;

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

const hasEveryKey = (shape: unknown, ...candidates: unknown[]) =>
  typeof shape !== 'object' ||
  shape === null ||
  candidates.every(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      Object.entries(shape).every(
        ([key, value]) => value === undefined || key in candidate,
      ),
  );

const isString = (...candidates: unknown[]) =>
  candidates.every((candidate) => typeof candidate === 'string');
