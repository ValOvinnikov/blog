import { useConsentPreferences } from '@web/context/consent-preferences-provider';

export const PREFERENCES_OPEN_TEXT = 'Preferences open';
export const PREFERENCES_CLOSED_TEXT = 'Preferences closed';
export const OPEN_PREFERENCES_BUTTON_NAME = 'Open preferences';

export const PreferencesState = () => {
  const { isOpen } = useConsentPreferences();
  return <p>{isOpen ? PREFERENCES_OPEN_TEXT : PREFERENCES_CLOSED_TEXT}</p>;
};

export const OpenPreferencesButton = () => {
  const { open } = useConsentPreferences();
  return <button onClick={open}>{OPEN_PREFERENCES_BUTTON_NAME}</button>;
};
