/**
 * Every `site-messages.en.json` key deliberately left out of `VOICE_FIELDS`,
 * grouped by why: accessibility-only text, generic toast/operation feedback,
 * counters carrying ICU plural syntax, metadata with no visible counterpart,
 * archive/breadcrumb labels derived from Studio content, a taxonomy label
 * tied to a Sanity-modelled enum, and fixed operational newsletter copy. The
 * coverage test fails if a catalog key is on neither this list nor
 * `VOICE_FIELDS`, so a new string can't be added without deciding which.
 */
export const VOICE_FIXED_KEYS = [
  // Accessibility-only: an aria-label, aria-live announcement, or visually
  // hidden label whose text never reaches a sighted reader.
  'breadcrumbs.ariaLabel',
  'localeErrorPage.announcement',
  'postShare.shareAriaLabel',
  'postShare.panelAriaLabel',
  'siteNavigation.toggleMenu',
  'brandLockupLink.ariaLabel',
  'topicChipList.ariaLabel',
  'blogListPage.paginationAriaLabel',
  'blogPostPage.depthToggle.ariaLabel',
  'blogPostPage.backToTop.ariaLabel',
  'topicPage.paginationAriaLabel',
  'tagPage.paginationAriaLabel',
  'rss.feedLinkLabel',
  'authMenu.panelAriaLabel',
  'authMenu.emailAriaLabel',
  'authMenu.accountMenuAriaLabel',
  'authMenu.loadingAccountStatus',
  'toastProvider.viewportAriaLabel',
  'toastProvider.dismissLabel',
  'bookmarkButton.saveAriaLabel',
  'bookmarkButton.removeAriaLabel',
  'accountPage.privacy.deleteConfirmAriaLabel',
  'accountPage.identity.displayNameAriaLabel',

  // Archive/breadcrumb labels read only as the post list's accessible name,
  // or derived from Studio content rather than authored directly.
  'postLatestModule.fallbackHeading',
  'blogListPage.title',
  'topicPage.title',
  'tagPage.title',
  'breadcrumbs.home',
  'breadcrumbs.topics',
  'breadcrumbs.tags',
  'breadcrumbs.blog',

  // A taxonomy label tied to a Sanity-modelled enum (`ASIDE_KIND`) rather
  // than freestanding site chrome.
  'blogPostPage.asideKind.WHY_NOT',
  'blogPostPage.asideKind.DIGRESSION',
  'blogPostPage.asideKind.CONTEXT',

  // Generic operation feedback rendered by a toast, not curated voice.
  'bookmarkButton.error',
  'bookmarkButton.toastSavedMessage',
  'bookmarkButton.toastRemovedMessage',
  'bookmarkButton.toastRevertedMessage',
  'bookmarkButton.toastUndoLabel',
  'bookmarkButton.toastRetryLabel',
  'accountPage.privacy.deleteToastLoadingMessage',
  'accountPage.privacy.deleteToastSuccessMessage',
  'accountPage.privacy.deleteError',
  'accountPage.newsletter.unsubscribeToastLoadingMessage',
  'accountPage.newsletter.unsubscribeToastSuccessMessage',
  'accountPage.newsletter.unsubscribeError',
  'accountPage.newsletter.resendToastLoadingMessage',
  'accountPage.newsletter.resendToastSuccessMessage',
  'accountPage.newsletter.resendError',
  'accountPage.identity.unlinkToastLoadingMessage',
  'accountPage.identity.unlinkToastSuccessMessage',
  'accountPage.identity.unlinkError',
  'accountPage.identity.unlinkLastMethodError',
  'accountPage.identity.saveToastLoadingMessage',
  'accountPage.identity.saveToastSuccessMessage',
  'accountPage.identity.saveError',

  // Counters carrying ICU plural syntax; they read the same in every voice.
  'pagination.pageSuffix',
  'topicsPage.postsCount',
  'tagsPage.postsCount',
  'toastProvider.mergeCountSuffix',
  'bookmarksPage.hint',

  // Metadata with no visible counterpart.
  'accountPage.metaDescription',
  'bookmarksPage.metaDescription',
  'rss.fallbackTitle',
  'rss.fallbackDescription',

  // Fixed operational newsletter form and landing-page copy.
  'newsletterForm.submitLabel',
  'newsletterForm.emailAriaLabel',
  'newsletterForm.placeholder',
  'newsletterForm.successMessage',
  'newsletterForm.errorInvalid',
  'newsletterForm.errorAlreadySubscribed',
  'newsletterForm.errorServer',
  'newsletterConfirm.confirmedTitle',
  'newsletterConfirm.confirmedMessage',
  'newsletterConfirm.invalidTitle',
  'newsletterConfirm.invalidMessage',
  'newsletterConfirm.errorTitle',
  'newsletterConfirm.errorMessage',
  'newsletterConfirm.returnHome',
  'newsletterUnsubscribe.confirmTitle',
  'newsletterUnsubscribe.confirmMessage',
  'newsletterUnsubscribe.confirmButtonLabel',
  'newsletterUnsubscribe.successTitle',
  'newsletterUnsubscribe.successMessage',
  'newsletterUnsubscribe.invalidTitle',
  'newsletterUnsubscribe.invalidMessage',
  'newsletterUnsubscribe.returnHome',
] as const;
