export type TVoicePack = {
  notFound?: {
    metaTitle?: string;
    metaDescription?: string;
    commandNotFound?: string;
    description?: string;
    returnHome?: string;
  };
  authMenu?: {
    guestLabel?: string;
    promptHost?: string;
    promptCommandSignIn?: string;
    promptCommandAccount?: string;
    chooseProviderPrompt?: string;
  };
  bookmarkButton?: {
    save?: string;
    saved?: string;
    toastCommand?: string;
    toastSavedState?: string;
    toastSavedMessage?: string;
    toastRemovedState?: string;
    toastRemovedMessage?: string;
    toastErrorState?: string;
    toastRevertedState?: string;
    toastRevertedMessage?: string;
    toastUndoLabel?: string;
    toastRetryLabel?: string;
  };
  bookmarksPage?: {
    promptSymbol?: string;
    promptCommand?: string;
    promptFlag?: string;
  };
  newsletterForm?: {
    trustCueNoSpam?: string;
    trustCueUnsubscribe?: string;
  };
  accountPage?: {
    privacy?: {
      promptHost?: string;
      promptCommand?: string;
      promptTag?: string;
      exportButton?: string;
      deleteLabel?: string;
      deleteConfirmPlaceholder?: string;
      deleteButton?: string;
      deleteToastCommand?: string;
      deleteToastLoadingState?: string;
      deleteToastSuccessState?: string;
      deleteToastErrorState?: string;
    };
    newsletter?: {
      promptHost?: string;
      promptCommand?: string;
      activeBadge?: string;
      unsubscribeButton?: string;
      pendingBadge?: string;
      resendButton?: string;
      unsubscribeToastCommand?: string;
      unsubscribeToastLoadingState?: string;
      unsubscribeToastSuccessState?: string;
      unsubscribeToastErrorState?: string;
      resendToastCommand?: string;
      resendToastLoadingState?: string;
      resendToastSuccessState?: string;
      resendToastErrorState?: string;
    };
    identity?: {
      promptHost?: string;
      promptCommand?: string;
      linkedStatus?: string;
      linkButton?: string;
      unlinkButton?: string;
      lastMethodNotice?: string;
      unlinkToastCommand?: string;
      unlinkToastLoadingState?: string;
      unlinkToastSuccessState?: string;
      unlinkToastErrorState?: string;
      saveButton?: string;
      saveToastCommand?: string;
      saveToastLoadingState?: string;
      saveToastSuccessState?: string;
      saveToastErrorState?: string;
    };
  };
};

const TERMINAL_PROMPT_HOST = '~$';
const TOAST_FAILED_STATE = 'failed';

export const CONSOLE_VOICE_PACK: TVoicePack = {
  notFound: {
    commandNotFound: 'command not found',
    description: "That route doesn't resolve to anything here.",
  },
  authMenu: {
    guestLabel: 'guest',
    promptHost: TERMINAL_PROMPT_HOST,
    promptCommandSignIn: 'auth login',
    promptCommandAccount: 'whoami',
    chooseProviderPrompt: 'choose a provider',
  },
  bookmarkButton: {
    save: 'save',
    saved: 'saved',
    toastCommand: 'bookmark',
    toastSavedState: 'saved',
    toastSavedMessage: 'stashed to ~/bookmarks',
    toastRemovedState: 'removed',
    toastRemovedMessage: 'removed from ~/bookmarks',
    toastErrorState: TOAST_FAILED_STATE,
    toastRevertedState: 'reverted',
    toastRevertedMessage: 'reverted',
    toastUndoLabel: 'undo',
    toastRetryLabel: 'retry',
  },
  bookmarksPage: {
    promptSymbol: '$',
    promptCommand: 'ls ~/bookmarks',
    promptFlag: '-l',
  },
  newsletterForm: {
    trustCueNoSpam: 'no spam',
    trustCueUnsubscribe: 'unsubscribe in one line',
  },
  accountPage: {
    privacy: {
      promptHost: TERMINAL_PROMPT_HOST,
      promptCommand: 'account --privacy',
      promptTag: 'data',
      exportButton: '↓ request export',
      deleteLabel: '⚠ Delete account',
      deleteConfirmPlaceholder: 'type: {handle}',
      deleteButton: 'delete account',
      deleteToastCommand: 'account',
      deleteToastLoadingState: 'deleting',
      deleteToastSuccessState: 'deleted',
      deleteToastErrorState: TOAST_FAILED_STATE,
    },
    newsletter: {
      promptHost: TERMINAL_PROMPT_HOST,
      promptCommand: 'account --email',
      activeBadge: 'subscribed',
      unsubscribeButton: 'unsubscribe',
      pendingBadge: 'pending confirmation',
      resendButton: '↻ resend confirmation',
      unsubscribeToastCommand: 'newsletter',
      unsubscribeToastLoadingState: 'unsubscribing',
      unsubscribeToastSuccessState: 'unsubscribed',
      unsubscribeToastErrorState: TOAST_FAILED_STATE,
      resendToastCommand: 'newsletter',
      resendToastLoadingState: 'resending',
      resendToastSuccessState: 'resent',
      resendToastErrorState: TOAST_FAILED_STATE,
    },
    identity: {
      promptHost: TERMINAL_PROMPT_HOST,
      promptCommand: 'account --identities',
      linkedStatus: '✓ linked',
      linkButton: 'link',
      unlinkButton: 'unlink',
      lastMethodNotice: "last remaining method — can't unlink",
      unlinkToastCommand: 'identity',
      unlinkToastLoadingState: 'unlinking',
      unlinkToastSuccessState: 'unlinked',
      unlinkToastErrorState: TOAST_FAILED_STATE,
      saveButton: 'save',
      saveToastCommand: 'identity',
      saveToastLoadingState: 'saving',
      saveToastSuccessState: 'saved',
      saveToastErrorState: TOAST_FAILED_STATE,
    },
  },
};

export const EDITORIAL_VOICE_PACK: TVoicePack = {};
