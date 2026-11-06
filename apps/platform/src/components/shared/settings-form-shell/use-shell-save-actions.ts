import type { TSettingsForm } from './settings-form-types';
import { useSaveFocusReturn } from './use-save-focus-return';
import { useSavedStatus } from './use-saved-status';
import { useSettingsDraft } from './use-settings-draft';
import { useUnsavedPageProtection } from './use-unsaved-page-protection';

type TShellSaveActionsArgs<TValues> = {
  form: TSettingsForm<TValues>;
  pageTitle: string;
  hasSavedStatus: boolean;
};

export const useShellSaveActions = <TValues>({
  form,
  pageTitle,
  hasSavedStatus,
}: TShellSaveActionsArgs<TValues>) => {
  const { save, discard, draft, changeCount, changesByLanguage, isPending } =
    form;
  const isDirty = changeCount > 0;
  const { isSavedStatusShown, markSaved } = useSavedStatus(
    isDirty,
    hasSavedStatus,
  );
  const {
    offer,
    restore,
    forget: forgetDraft,
  } = useSettingsDraft(draft, isDirty);
  const { titleRef, saveBarRef, rememberControl, returnFocus } =
    useSaveFocusReturn();

  const handleSave = async () => {
    const isSaved = await save();
    if (isSaved) {
      forgetDraft();
      markSaved();
    }
    return isSaved;
  };

  const saveAndReturnFocus = async () => {
    if (await handleSave()) returnFocus();
  };

  const handleDiscard = () => {
    discard();
    forgetDraft();
  };

  useUnsavedPageProtection({
    pageTitle,
    changeCount,
    changesByLanguage,
    isPending,
    save: handleSave,
    discard: handleDiscard,
  });

  return {
    isSavedStatusShown,
    offer,
    restore,
    forgetDraft,
    handleDiscard,
    titleRef,
    saveBarRef,
    rememberControl,
    saveAndReturnFocus,
  };
};
