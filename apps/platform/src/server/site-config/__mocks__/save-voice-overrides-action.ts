import type { saveVoiceOverridesAction as TSaveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';

export const saveVoiceOverridesAction =
  vi.fn<typeof TSaveVoiceOverridesAction>();
