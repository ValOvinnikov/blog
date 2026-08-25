import type { TVoiceOverrideKey } from '@admin/utils/voice-fields/voice-fields';
import type { TVoicePack } from '@blog/config/constants';

/**
 * Resolves the text a curated voice field falls back to when its override is
 * blank — the placeholder shown in its input. `TVoicePack`'s shape predates
 * the 19-key curated field set (it's nested by feature area, e.g.
 * `notFound.commandNotFound`, not flat); this maps each curated key to its
 * pack path. The 5 empty-state keys (`blogListEmpty`, `topicEmpty`,
 * `tagEmpty`, `topicsEmpty`, `bookmarksEmpty`) have no `case`
 * here because `TVoicePack` has no corresponding field for them at all —
 * their input renders with no placeholder, which is accurate (there is
 * genuinely nothing to inherit), not a bug in this mapping.
 */
export const inheritedVoiceValue = (
  voicePack: TVoicePack,
  key: TVoiceOverrideKey,
): string | undefined => {
  switch (key) {
    case 'notFoundMetaTitle':
      return voicePack.notFound?.metaTitle;
    case 'notFoundMetaDescription':
      return voicePack.notFound?.metaDescription;
    case 'notFoundCommandNotFound':
      return voicePack.notFound?.commandNotFound;
    case 'notFoundDescription':
      return voicePack.notFound?.description;
    case 'notFoundReturnHome':
      return voicePack.notFound?.returnHome;
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
};
