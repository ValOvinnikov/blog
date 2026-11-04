import { useSavedStatus } from './use-saved-status';
import {
  useSettingsDraft,
  type TSettingsFormDraft,
} from './use-settings-draft';

type TShellSaveActionsArgs<TValues> = {
  save: () => Promise<boolean>;
  discard: () => void;
  draft: TSettingsFormDraft<TValues>;
  isDirty: boolean;
  hasSavedStatus: boolean;
};

export const useShellSaveActions = <TValues>({
  save,
  discard,
  draft,
  isDirty,
  hasSavedStatus,
}: TShellSaveActionsArgs<TValues>) => {
  const { isSavedStatusShown, markSaved } = useSavedStatus(
    isDirty,
    hasSavedStatus,
  );
  const {
    offer,
    restore,
    forget: forgetDraft,
  } = useSettingsDraft(draft, isDirty);

  const handleSave = async () => {
    const isSaved = await save();
    if (isSaved) {
      forgetDraft();
      markSaved();
    }
    return isSaved;
  };

  const handleDiscard = () => {
    discard();
    forgetDraft();
  };

  return {
    isSavedStatusShown,
    offer,
    restore,
    forgetDraft,
    handleSave,
    handleDiscard,
  };
};
