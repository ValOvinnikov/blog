import type { TVoiceOverrideKey } from '@admin/utils/voice-fields/voice-fields';
import type { TVoicePack } from '@blog/config/constants';

/**
 * Resolves the text a curated voice field falls back to when its override is
 * blank — the placeholder shown in its input. `TVoicePack`'s shape predates
 * the 20-key curated field set (it's nested by feature area, e.g.
 * `notFound.commandNotFound`, not flat); this maps each curated key to its
 * pack path where one already exists. A key with no `case` here has no
 * corresponding value anywhere in `TVoicePack` yet — its input renders with
 * no placeholder, which is accurate (there is genuinely nothing configured
 * to inherit), not a bug in this mapping.
 */
export function inheritedVoiceValue(
  voicePack: TVoicePack,
  key: TVoiceOverrideKey,
): string | undefined {
  switch (key) {
    case 'notFoundCommandNotFound':
      return voicePack.notFound?.commandNotFound;
    case 'notFoundDescription':
      return voicePack.notFound?.description;
    case 'terminalPromptHost':
      return voicePack.authMenu?.promptHost;
    case 'authPromptCommandSignIn':
      return voicePack.authMenu?.promptCommandSignIn;
    case 'authPromptCommandAccount':
      return voicePack.authMenu?.promptCommandAccount;
    case 'bookmarksPromptCommand':
      return voicePack.bookmarksPage?.promptCommand;
    case 'accountPrivacyPromptCommand':
      return voicePack.accountPage?.privacy?.promptCommand;
    case 'accountNewsletterPromptCommand':
      return voicePack.accountPage?.newsletter?.promptCommand;
    case 'accountIdentityPromptCommand':
      return voicePack.accountPage?.identity?.promptCommand;
    case 'bookmarkToastSavedMessage':
      return voicePack.bookmarkButton?.toastSavedMessage;
    case 'bookmarkToastRemovedMessage':
      return voicePack.bookmarkButton?.toastRemovedMessage;
    default:
      return undefined;
  }
}
