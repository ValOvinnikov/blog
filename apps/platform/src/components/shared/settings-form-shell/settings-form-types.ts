import type { TMaybeUndefined } from '@blog/config';
import type { TLanguageChangeCount } from '@platform/utils/format-language-changes/format-language-changes';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';

import type { TSettingsFormDraft } from './use-settings-draft';

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
