import type { TLanguageChangeCount } from '@platform/utils/format-language-changes/format-language-changes';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import type {
  TActionOutcome,
  TMaybeUndefined,
  TOutcome,
} from '@shinefold/config';

import type { TSettingsFormDraft } from './use-settings-draft';

export type TPlanRefusalMessageKey = 'notInPlan' | 'languagesNotInPlan';

export type TSettingsForm<TValues> = {
  save: () => Promise<boolean>;
  discard: () => void;
  changeCount: number;
  changesByLanguage: TLanguageChangeCount[];
  invalidControls: TMaybeUndefined<TInvalidControls>;
  isPending: boolean;
  isArchived: boolean;
  archivedAt: TMaybeUndefined<Date>;
  archivedNoticeId: string;
  draft: TSettingsFormDraft<TValues>;
  planRefusal?: string;
};

type TSettingsFormDraftConfig<TValues> = Omit<
  TSettingsFormDraft<TValues>,
  'values' | 'savedValues' | 'onRestore'
> & {
  onRestore?: (values: TValues) => void;
};

export type TUseSettingsFormArgs<
  TValues,
  TResult extends TOutcome<TActionOutcome>,
> = {
  initialValues: TValues;
  archivedAt: TMaybeUndefined<Date>;
  onSubmit: (values: TValues) => Promise<TResult>;
  onSuccess?: (values: TValues, result: TResult) => void;
  onDiscard?: () => void;
  countChanges: (values: TValues, savedValues: TValues) => number;
  countChangesByLanguage?: (
    values: TValues,
    savedValues: TValues,
  ) => TLanguageChangeCount[];
  invalidControls?: (values: TValues) => TInvalidControls;
  canSave?: (values: TValues) => boolean;
  planRefusalMessageKey?: TPlanRefusalMessageKey;
  draft: TSettingsFormDraftConfig<TValues>;
};
