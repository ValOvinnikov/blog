import { useState } from 'react';

export const useSavedStatus = (isDirty: boolean, hasSavedStatus: boolean) => {
  const [hasSavedSinceEdit, setHasSavedSinceEdit] = useState(false);
  const [wasDirty, setWasDirty] = useState(isDirty);
  // Reset on the clean-to-dirty edge: a page can still be dirty for a render
  // after onSave resolves.
  if (isDirty !== wasDirty) {
    setWasDirty(isDirty);
    if (isDirty) setHasSavedSinceEdit(false);
  }

  return {
    isSavedStatusShown: hasSavedStatus && !isDirty && hasSavedSinceEdit,
    markSaved: () => setHasSavedSinceEdit(true),
  };
};
